# React UI

The project now includes a React-based interface at `react_ui/`. It uses the
same SQLite database as the Streamlit app for consent events and demo rights
requests.

## Install dependencies

From the project folder, create and activate a virtual environment, then install
the dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, run this once in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Run the React UI

From the project folder:

```powershell
python api.py
```

Open `http://127.0.0.1:8504` in a browser.

Stop the server with `Ctrl+C`.

## Run the Streamlit app

In a second terminal, from the project folder:

```powershell
python -m streamlit run app.py
```

Streamlit opens its local URL, normally `http://localhost:8501`.

The React UI intentionally keeps the existing demo profiles, consent purposes,
notice version, learning/quiz pages, consent history, rights requests and
project limitations. It does not add authentication or real data processing.
