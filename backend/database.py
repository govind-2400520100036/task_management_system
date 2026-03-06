import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():

    conn = sqlite3.connect(DATABASE_URL)

    conn.row_factory = sqlite3.Row

    return conn


def init_db():

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS User(
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS Tasks(
        task_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        task_name TEXT,
        priority TEXT,
        status TEXT,
        FOREIGN KEY(username) REFERENCES User(username)
    )
    """)

    conn.commit()

    conn.close()