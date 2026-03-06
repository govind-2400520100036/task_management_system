from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt
import bcrypt
import os
from dotenv import load_dotenv
from database import get_connection, init_db

load_dotenv()

SECRET = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("ALGORITHM")

app = FastAPI()

init_db()

security = HTTPBearer()

ALLOWED_STATUS = {"To Do", "In Progress", "Done"}

# --------------------
# Models
# --------------------

class User(BaseModel):
    username: str
    password: str


class TaskAdd(BaseModel):
    task_name: str
    priority: str


class StatusUpdate(BaseModel):
    task_id: int
    status: str


# --------------------
# JWT Functions
# --------------------

def create_token(username):

    payload = {"username": username}

    token = jwt.encode(payload, SECRET, algorithm=ALGORITHM)

    return token


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])

        username = payload["username"]

        return username

    except:

        raise HTTPException(status_code=401, detail="Invalid token")


# --------------------
# AUTH APIs
# --------------------

@app.post("/signup")
def signup(user: User):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("SELECT username FROM User WHERE username=?", (user.username,))

    if cur.fetchone():

        conn.close()

        return {"error": "username exists"}

    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())

    cur.execute(

        "INSERT INTO User(username,password) VALUES (?,?)",

        (user.username, hashed)

    )

    conn.commit()

    conn.close()

    return {"message": "user created"}


@app.post("/signin")
def signin(user: User):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("SELECT password FROM User WHERE username=?", (user.username,))

    row = cur.fetchone()

    conn.close()

    if not row:

        return {"error": "invalid credentials"}

    stored_password = row["password"]

    if bcrypt.checkpw(user.password.encode(), stored_password):

        token = create_token(user.username)

        return {"token": token}

    return {"error": "invalid credentials"}


# --------------------
# TASK APIs
# --------------------

@app.post("/task/add")
def add_task(task: TaskAdd, username=Depends(get_current_user)):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""

    INSERT INTO Tasks(username,task_name,priority,status)

    VALUES (?,?,?,?)

    """, (username, task.task_name, task.priority, "To Do"))

    conn.commit()

    task_id = cur.lastrowid

    conn.close()

    return {"task_id": task_id}


@app.post("/task/update_status")
def update_status(data: StatusUpdate, username=Depends(get_current_user)):

    if data.status not in ALLOWED_STATUS:

        raise HTTPException(status_code=400, detail="Invalid status")

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""

    UPDATE Tasks

    SET status=?

    WHERE task_id=? AND username=?

    """, (data.status, data.task_id, username))

    conn.commit()

    conn.close()

    return {"message": "updated"}


@app.post("/task/delete")
def delete_task(task_id: int, username=Depends(get_current_user)):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""

    DELETE FROM Tasks

    WHERE task_id=? AND username=?

    """, (task_id, username))

    conn.commit()

    conn.close()

    return {"message": "deleted"}


@app.get("/task/show")
def show_tasks(username=Depends(get_current_user)):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""

    SELECT task_id, task_name, priority, status

    FROM Tasks

    WHERE username=?

    """, (username,))

    rows = cur.fetchall()

    conn.close()

    tasks = []

    for r in rows:

        tasks.append({

            "task_id": r["task_id"],

            "task_name": r["task_name"],

            "priority": r["priority"],

            "status": r["status"]

        })

    return tasks


@app.get("/task/search")
def search_task(query: str, username=Depends(get_current_user)):

    conn = get_connection()

    cur = conn.cursor()

    pattern = f"%{query}%"

    cur.execute("""

    SELECT task_id, task_name, priority, status

    FROM Tasks

    WHERE username=? AND task_name LIKE ?

    """, (username, pattern))

    rows = cur.fetchall()

    conn.close()

    tasks = []

    for r in rows:

        tasks.append({

            "task_id": r["task_id"],

            "task_name": r["task_name"],

            "priority": r["priority"],

            "status": r["status"]

        })

    return tasks