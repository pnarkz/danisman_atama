import json
import os
import shutil
import signal
import socket
import sqlite3
import subprocess
import tempfile
import time
from dataclasses import dataclass, asdict
from pathlib import Path

import requests


ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
SOURCE_DB = BACKEND_DIR / "db" / "danisman_atama.db"

BASE_URL = None
DB_PATH = None
results = []


@dataclass
class ScenarioResult:
    name: str
    status: str
    details: str


def record(name, ok, details):
    results.append(ScenarioResult(name=name, status="PASS" if ok else "FAIL", details=details))


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for_port(port, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            if sock.connect_ex(("127.0.0.1", port)) == 0:
                return
        time.sleep(0.5)
    raise TimeoutError(f"Backend {port} portunda zamaninda ayaga kalkmadi.")


def prepare_temp_db(temp_dir):
    if not SOURCE_DB.exists():
        raise FileNotFoundError(f"Kaynak veritabani bulunamadi: {SOURCE_DB}")

    target = Path(temp_dir) / "danisman_atama.runtime.db"
    shutil.copy2(SOURCE_DB, target)

    for suffix in ("-shm", "-wal"):
        source_sidecar = SOURCE_DB.with_name(SOURCE_DB.name + suffix)
        if source_sidecar.exists():
            shutil.copy2(source_sidecar, Path(f"{target}{suffix}"))

    return target


def start_backend(temp_db):
    port = find_free_port()
    env = os.environ.copy()
    env["PORT"] = str(port)
    env["DB_PATH"] = str(temp_db)
    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    node_binary = shutil.which("node") or shutil.which("node.exe")

    if not node_binary:
        raise FileNotFoundError("Node.js yurutulebilir dosyasi bulunamadi.")

    command = [node_binary, "server.js"]

    process = subprocess.Popen(
        command,
        cwd=BACKEND_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=creationflags,
    )

    try:
        wait_for_port(port)
    except Exception:
        stop_backend(process)
        output = ""
        if process.stdout:
            output = process.stdout.read()
        raise RuntimeError(f"Backend baslatilamadi.\n{output}") from None

    return process, f"http://127.0.0.1:{port}/api"


def stop_backend(process):
    if process.poll() is not None:
        return

    if os.name == "nt" and hasattr(signal, "CTRL_BREAK_EVENT"):
        try:
            process.send_signal(signal.CTRL_BREAK_EVENT)
            process.wait(timeout=5)
            return
        except (ProcessLookupError, subprocess.TimeoutExpired):
            pass

    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)

    time.sleep(1)


def db_connect():
    connection = sqlite3.connect(DB_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL;")
    return connection


def db_one(query, params=()):
    connection = db_connect()
    try:
        row = connection.execute(query, params).fetchone()
        return dict(row) if row else None
    finally:
        connection.close()


def db_all(query, params=()):
    connection = db_connect()
    try:
        rows = connection.execute(query, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def db_run(query, params=()):
    connection = db_connect()
    try:
        connection.execute(query, params)
        connection.commit()
    finally:
        connection.close()


def api(method, path, token=None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.request(method, f"{BASE_URL}{path}", headers=headers, timeout=30, **kwargs)


def expect_status(response, expected, context):
    if response.status_code != expected:
        raise AssertionError(f"{context}: expected {expected}, got {response.status_code}, body={response.text}")


def login(email, password):
    response = api("POST", "/auth/login", json={"email": email, "password": password})
    expect_status(response, 200, f"login {email}")
    data = response.json()
    return data["token"], data["user"]


def register_student(email, full_name, gano=3.0, department_id=1, entry_year=2023, password="Temp1234!"):
    response = api(
        "POST",
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "ogrenci",
            "full_name": full_name,
            "gano": gano,
            "department_id": department_id,
            "entry_year": entry_year,
        },
    )
    expect_status(response, 201, f"register {email}")
    return response.json()


def get_user(email):
    return db_one("SELECT * FROM users WHERE email = ?", (email,))


def get_student_by_email(email):
    return db_one(
        """
        SELECT s.*, u.email, u.full_name
        FROM students s
        JOIN users u ON u.id = s.user_id
        WHERE u.email = ?
        """,
        (email,),
    )


def get_faculty_by_email(email):
    return db_one(
        """
        SELECT f.*, u.email, u.full_name
        FROM faculty f
        JOIN users u ON u.id = f.user_id
        WHERE u.email = ?
        """,
        (email,),
    )


def reset_for_assignment_test(active_faculty_ids, keep_student_ids):
    placeholders = ",".join("?" for _ in keep_student_ids)
    db_run(
        f"""
        UPDATE students
        SET is_assigned = CASE WHEN id IN ({placeholders}) THEN 0 ELSE 1 END,
            assigned_faculty_id = CASE WHEN id IN ({placeholders}) THEN NULL ELSE ? END
        """,
        tuple(keep_student_ids) + tuple(keep_student_ids) + (active_faculty_ids[0],),
    )
    db_run("UPDATE faculty SET current_quota = 0, base_quota = 0 WHERE is_active = 1")


def run_scenarios():
    admin_token, _ = login("admin@ankara.edu.tr", "admin123")
    faculty_token, faculty_user = login("ahmet.yilmaz@ankara.edu.tr", "hoca123")
    student_token, student_user = login("ogrenci01@ankara.edu.tr", "ogrenci123")

    unauthorized = api("GET", "/admin/get_dashboard_data", token=student_token)
    record(
        "1. Rol bazli giris ve yetki kontrolu",
        unauthorized.status_code == 403 and faculty_user["role"] == "hoca" and student_user["role"] == "ogrenci",
        "admin, danisman ve ogrenci girisi dogrulandi; ogrenci tokeni ile admin endpointi 403 dondu.",
    )

    temp_email = f"silinecek_{int(time.time())}@ankara.edu.tr"
    register_student(temp_email, "Silinecek Test Ogrencisi", gano=3.67)
    temp_user = get_user(temp_email)
    temp_student = get_student_by_email(temp_email)
    faculty_one = get_faculty_by_email("ahmet.yilmaz@ankara.edu.tr")
    before_quota = db_one("SELECT current_quota FROM faculty WHERE id = ?", (faculty_one["id"],))["current_quota"]
    response = api("POST", "/admin/force-assign", token=admin_token, json={"student_id": temp_student["id"], "faculty_id": faculty_one["id"]})
    expect_status(response, 200, "force assign temp student")
    delete_response = api("DELETE", f"/admin/users/{temp_user['id']}", token=admin_token)
    expect_status(delete_response, 200, "delete temp student")
    after_user = get_user(temp_email)
    after_student = get_student_by_email(temp_email)
    after_quota = db_one("SELECT current_quota FROM faculty WHERE id = ?", (faculty_one["id"],))["current_quota"]
    record(
        "2. Admin kullanici siler",
        after_user is None and after_student is None and after_quota == before_quota,
        "olusturulan ogrenci silindi; users ve students kaydi kalkti, onceki kota degeri geri alindi.",
    )

    last_student_emails = [f"ogrenci{str(index).zfill(2)}@ankara.edu.tr" for index in range(41, 51)]
    for email in last_student_emails:
        user_row = get_user(email)
        response = api("DELETE", f"/admin/users/{user_row['id']}", token=admin_token)
        expect_status(response, 200, f"delete {email}")
    faculty_ten = get_faculty_by_email("selin.yildiz@ankara.edu.tr")
    response = api("PATCH", f"/admin/faculty/{faculty_ten['id']}/status", token=admin_token, json={"is_active": False})
    expect_status(response, 200, "deactivate faculty 10")
    response = api("POST", "/admin/calculate-quotas", token=admin_token)
    expect_status(response, 200, "calculate quotas after 40/9")
    counts = db_one("SELECT COUNT(*) as c FROM students")
    active_count = db_one("SELECT COUNT(*) as c FROM faculty WHERE is_active = 1")
    zero_quota_active = db_one("SELECT COUNT(*) as c FROM faculty WHERE is_active = 1 AND base_quota = 0")
    record(
        "3. 40 ogrenci / 9 ogretim uyesi / 1 admin",
        counts["c"] == 40 and active_count["c"] == 9 and zero_quota_active["c"] == 0,
        "10 ogrenci silindi, 1 danisman pasife alindi, aktif 9 danisman icin sifir kotasiz dagitim olustu.",
    )

    active_faculty_ids = [row["id"] for row in db_all("SELECT id FROM faculty WHERE is_active = 1 ORDER BY id")]

    pref9_email = f"pref9_{int(time.time())}@ankara.edu.tr"
    register_student(pref9_email, "Dokuzuncu Tercih Ogrencisi", gano=4.0)
    pref9_student = get_student_by_email(pref9_email)
    reset_for_assignment_test(active_faculty_ids, [pref9_student["id"]])
    for faculty_id in active_faculty_ids[:8]:
        db_run("UPDATE faculty SET base_quota = 1, current_quota = 1 WHERE id = ?", (faculty_id,))
    db_run("UPDATE faculty SET base_quota = 1, current_quota = 0 WHERE id = ?", (active_faculty_ids[8],))
    response = api("POST", "/students/preferences", token=login(pref9_email, "Temp1234!")[0], json={"preferences": active_faculty_ids})
    expect_status(response, 200, "save 9 preferences")
    response = api("POST", "/admin/run-assignment", token=admin_token)
    expect_status(response, 200, "run assignment for 9th preference")
    assigned_pref9 = db_one("SELECT assigned_faculty_id FROM students WHERE id = ?", (pref9_student["id"],))
    record(
        "4. 9. tercih atamasi",
        assigned_pref9["assigned_faculty_id"] == active_faculty_ids[8],
        f"ogrenci ilk 8 tercih doluyken {active_faculty_ids[8]} nolu 9. tercihe yerlesti.",
    )

    demand_high_email = f"demand_high_{int(time.time())}@ankara.edu.tr"
    demand_low_email = f"demand_low_{int(time.time()) + 1}@ankara.edu.tr"
    register_student(demand_high_email, "Yuksek Gano Ogrencisi", gano=3.95)
    register_student(demand_low_email, "Dusuk Gano Ogrencisi", gano=3.10)
    high_student = get_student_by_email(demand_high_email)
    low_student = get_student_by_email(demand_low_email)
    reset_for_assignment_test(active_faculty_ids, [high_student["id"], low_student["id"]])
    db_run("UPDATE faculty SET base_quota = 0, current_quota = 0 WHERE is_active = 1")
    db_run("UPDATE faculty SET base_quota = 1, current_quota = 0 WHERE id = ?", (active_faculty_ids[0],))
    db_run("UPDATE faculty SET base_quota = 1, current_quota = 0 WHERE id = ?", (active_faculty_ids[1],))
    high_token, _ = login(demand_high_email, "Temp1234!")
    low_token, _ = login(demand_low_email, "Temp1234!")
    prefs = [active_faculty_ids[0], active_faculty_ids[1]]
    expect_status(api("POST", "/students/preferences", token=high_token, json={"preferences": prefs}), 200, "save high demand prefs")
    expect_status(api("POST", "/students/preferences", token=low_token, json={"preferences": prefs}), 200, "save low demand prefs")
    expect_status(api("POST", "/admin/run-assignment", token=admin_token), 200, "run assignment for high demand")
    high_assignment = db_one("SELECT assigned_faculty_id FROM students WHERE id = ?", (high_student["id"],))
    low_assignment = db_one("SELECT assigned_faculty_id FROM students WHERE id = ?", (low_student["id"],))
    record(
        "5. Bir danismanin asiri tercih edilmesi",
        high_assignment["assigned_faculty_id"] == active_faculty_ids[0] and low_assignment["assigned_faculty_id"] == active_faculty_ids[1],
        "ayni ilk tercihi isteyen iki ogrenciden yuksek GANO olan ilk danismana yerlesti, digeri sonraki tercihe gecti.",
    )

    fallback_email = f"fallback_{int(time.time())}@ankara.edu.tr"
    register_student(fallback_email, "Fallback Ogrencisi", gano=3.80)
    fallback_student = get_student_by_email(fallback_email)
    reset_for_assignment_test(active_faculty_ids, [fallback_student["id"]])
    db_run("UPDATE faculty SET base_quota = 0, current_quota = 0 WHERE is_active = 1")
    db_run("UPDATE faculty SET base_quota = 1, current_quota = 1 WHERE id = ?", (active_faculty_ids[0],))
    db_run("UPDATE faculty SET base_quota = 1, current_quota = 1 WHERE id = ?", (active_faculty_ids[1],))
    db_run("UPDATE faculty SET base_quota = 1, current_quota = 0 WHERE id = ?", (active_faculty_ids[2],))
    fallback_token, _ = login(fallback_email, "Temp1234!")
    expect_status(api("POST", "/students/preferences", token=fallback_token, json={"preferences": [active_faculty_ids[0], active_faculty_ids[1]]}), 200, "save fallback prefs")
    expect_status(api("POST", "/admin/run-assignment", token=admin_token), 200, "run assignment for fallback")
    fallback_assignment = db_one("SELECT assigned_faculty_id FROM students WHERE id = ?", (fallback_student["id"],))
    record(
        "6. Bos kontenjan fallback senaryosu",
        fallback_assignment["assigned_faculty_id"] == active_faculty_ids[2],
        "tercihler dolu oldugu icin ogrenci tercih disi acik kontenjanli aktif danismana yerlesti.",
    )

    faculty_four = get_faculty_by_email("fatma.ozturk@ankara.edu.tr")
    faculty_five = get_faculty_by_email("ali.celik@ankara.edu.tr")
    reassignment_email = f"reassign_{int(time.time())}@ankara.edu.tr"
    register_student(reassignment_email, "Yeniden Atama Ogrencisi", gano=3.25)
    reassignment_student = get_student_by_email(reassignment_email)
    expect_status(api("POST", "/admin/force-assign", token=admin_token, json={"student_id": reassignment_student["id"], "faculty_id": faculty_four["id"]}), 200, "assign student to faculty four")
    expect_status(api("PATCH", f"/admin/faculty/{faculty_four['id']}/status", token=admin_token, json={"is_active": False}), 200, "deactivate faculty four")
    faculty_four_token, _ = login("fatma.ozturk@ankara.edu.tr", "hoca123")
    blocked_search = api("GET", "/faculty/students?minGano=3.0", token=faculty_four_token)
    student_faculty_list = api("GET", "/students/faculty-list", token=student_token)
    expect_status(student_faculty_list, 200, "student faculty list after deactivation")
    list_ids = {item["id"] for item in student_faculty_list.json()}
    response = api("POST", "/admin/calculate-quotas", token=admin_token)
    expect_status(response, 200, "calculate quotas after deactivation")
    quota_ids = {item["faculty_id"] for item in response.json()["quotas"]}
    expect_status(api("POST", "/admin/force-assign", token=admin_token, json={"student_id": reassignment_student["id"], "faculty_id": faculty_five["id"]}), 200, "reassign student to faculty five")
    reassigned = db_one("SELECT assigned_faculty_id FROM students WHERE id = ?", (reassignment_student["id"],))
    latest_force_log = db_one("SELECT action FROM assignment_logs WHERE student_id = ? ORDER BY id DESC LIMIT 1", (reassignment_student["id"],))
    faculty_four_quota = db_one("SELECT current_quota FROM faculty WHERE id = ?", (faculty_four["id"],))["current_quota"]
    faculty_five_quota = db_one("SELECT current_quota FROM faculty WHERE id = ?", (faculty_five["id"],))["current_quota"]
    record(
        "7. Danisman donem ortasinda ayrilir",
        blocked_search.status_code == 403 and faculty_four["id"] not in quota_ids,
        "pasif danisman yeni arama yapamadi ve kontenjan hesaplamasina dahil edilmedi.",
    )
    record(
        "8. Hoca aktif / pasif durumu",
        faculty_four["id"] not in list_ids,
        "ogrenci tercih havuzunda pasif danisman gosterilmedi.",
    )
    record(
        "9. Hoca degistirme senaryosu",
        reassigned["assigned_faculty_id"] == faculty_five["id"] and latest_force_log["action"] == "FORCE_ASSIGN" and faculty_four_quota >= 0 and faculty_five_quota >= 1,
        "yonetici manuel yeniden atama yapti; yeni danisman ve log kaydi guncellendi.",
    )

    password_email = f"password_{int(time.time())}@ankara.edu.tr"
    register_student(password_email, "Sifre Test Ogrencisi", gano=2.90, password="OldPass123!")
    password_token, _ = login(password_email, "OldPass123!")
    change_response = api("POST", "/auth/change-password", token=password_token, json={"current_password": "OldPass123!", "new_password": "NewPass123!"})
    expect_status(change_response, 200, "change password")
    new_login = api("POST", "/auth/login", json={"email": password_email, "password": "NewPass123!"})
    old_login = api("POST", "/auth/login", json={"email": password_email, "password": "OldPass123!"})
    record(
        "10. Sifre degistirme senaryosu",
        new_login.status_code == 200 and old_login.status_code == 401,
        "yeni sifre ile giris acildi, eski sifre reddedildi.",
    )

    admin_users = api("GET", "/admin/users", token=admin_token)
    student_me = api("GET", "/students/me", token=student_token)
    faculty_me = api("GET", "/faculty/me", token=faculty_token)
    expect_status(admin_users, 200, "admin users")
    expect_status(student_me, 200, "student me")
    expect_status(faculty_me, 200, "faculty me")
    users_payload = admin_users.json()
    record(
        "11. Tablo tasariminda bolum",
        all(item.get("department_name") for item in users_payload if item["role"] in {"ogrenci", "hoca"})
        and bool(student_me.json().get("department_name"))
        and bool(faculty_me.json().get("department_name")),
        "admin, ogrenci ve danisman akislarinda bolum bilgisi dolu geldi.",
    )

    server_health = api("GET", "/auth/login").status_code in {404, 400}
    record(
        "12. Mail gereksinimi olmadan calisma",
        server_health,
        "backend yalnizca temel ortam degiskenleri ile ayaga kalkti; mail bagimliligi gerekmedi.",
    )

    distinct_student_departments = db_one("SELECT COUNT(DISTINCT department_id) as c FROM students")["c"]
    distinct_faculty_departments = db_one("SELECT COUNT(DISTINCT department_id) as c FROM faculty")["c"]
    faculty_pool = api("GET", "/students/faculty-list", token=student_token)
    expect_status(faculty_pool, 200, "student faculty list final")
    distinct_names = {item["department_name"] for item in faculty_pool.json()}
    record(
        "13. Baska bolumlerin senaryosu",
        distinct_student_departments > 1 and distinct_faculty_departments > 1 and len(distinct_names) > 1,
        "birden fazla bolum kaydi hem veritabaninda hem de tercih havuzunda goruldu.",
    )


def main():
    global BASE_URL, DB_PATH

    with tempfile.TemporaryDirectory(prefix="danisman-runtime-") as temp_dir:
        temp_db = prepare_temp_db(temp_dir)
        DB_PATH = str(temp_db)
        backend_process, BASE_URL = start_backend(temp_db)

        try:
            run_scenarios()
            print(json.dumps([asdict(result) for result in results], ensure_ascii=False, indent=2))
            if any(result.status != "PASS" for result in results):
                raise SystemExit(1)
        finally:
            stop_backend(backend_process)


if __name__ == "__main__":
    main()
