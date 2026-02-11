# Project: Task Management System

**Team Name:** TaskFlow

## 📝 Project Overview

A professional Kanban-based task management application. This system allows users to create accounts, manage tasks with priority levels (Low, Medium, High), and track progress through visual columns. It features a real-time search bar to filter tasks dynamically.

## 👥 Team Members

| S.No | Name | Roll No. | Role |
| --- | --- | --- | --- |
| 1 | Govind Singh | 2400520100036 | Database + Backend Developer |
| 2 | Anshuman Singh | 2400520100017 | Frontend Developer |
| 3 | Ankit Prajapati | 2400520100014 | Frontend Developer |
| 4 | Abhist Kumbhaj Pandey | 2400520100007 | Frontend Developer |

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript (Vanilla)
* **Backend:** FastAPI (Python)
* **Database:** SQLite3
* **Environment Management:** `python-dotenv`
* **Security:** Password Hashing (MD5/Bcrypt via Passlib)
* **Server/Hosting:** AWS EC2 (Linux/Ubuntu), Nginx

---

## 🔒 Security & Implementation 

### 1. Zero-Credential Repository

Following the strict security guidelines provided, this repository **does not store**:

* Database files (`.db`)
* API Keys or Secret Keys
* Environment configurations
All sensitive data is handled via a `.env` file which is explicitly ignored by Git using `.gitignore`.

### 2. Password Hashing

To protect user privacy, we do not store plain-text passwords.

* **Logic:** When a user signs up, the backend applies a hash (Bcrypt/MD5) to the password.
* **Storage:** Only the resulting "fingerprint" (hash) is stored in SQLite.
* **Verification:** During login, the system hashes the input and compares it to the stored hash.

### 3. Dynamic Task Search

The dashboard includes a search feature (visible in the UI) that allows users to find tasks by name or description.

* **Implementation:** The backend utilizes the SQL `LIKE` operator:
```sql
SELECT * FROM tasks WHERE task_name LIKE '%keyword%';

```


* **Frontend:** The search bar triggers an API call on every input change to filter the Kanban board in real-time.

---

## 🚀 Execution Flow (The "Linux Way")

### Local Setup

1. **Environment:** Create a `.env` file locally to define `DB_LOCATION` and `SECRET_KEY`.
2. **Database:** SQLite remains local to the machine for development.
3. **Run:** `uvicorn main:app --reload`

### AWS Hosting (EC2 Deployment)

At the time of hosting, the "hidden" configuration strategy is used:

1. **Hidden Config:** The `.env` file is manually created on the Linux server instance, keeping it invisible from the public GitHub repo.
2. **Reverse Proxy:** **Nginx** is configured on Ubuntu to handle incoming traffic and point it to the FastAPI backend.
3. **Process Management:** The backend runs as a background service so the API remains active 24/7.

---

## 🖼️ UI Screenshots

The system includes:

* **Signup/Login:** Secure entry points with credential hashing.
* **Task Dashboard:** Interactive Kanban board with priority tagging and a search filter.
