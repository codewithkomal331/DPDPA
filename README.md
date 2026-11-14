# KNOWN DPDPA AND CONSENT FLOW

A two-day academic MVP built with Python, Streamlit and SQLite.

## 1. Install Python
Use Python 3.10 or newer. During installation, select **Add Python to PATH**.

## 2. Open the project folder
Extract this ZIP. Open the extracted `KNOWN_DPDPA_AND_CONSENT_FLOW` folder in VS Code.

## 3. Open the VS Code terminal
Select Terminal > New Terminal. Make sure the terminal path is this project folder.

## 4. Create a virtual environment (recommended)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
If PowerShell blocks activation, use:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 5. Install libraries
```powershell
python -m pip install -r requirements.txt
```

## 6. Run the project
```powershell
python -m streamlit run app.py
```
A browser tab should open at the local Streamlit address.

## Demo accounts
| Role | Username | Password |
|---|---|---|
| Platform Admin | admin | Admin@123 |
| DPO | dpo | Dpo@123 |
| Employee | employee | Emp@123 |
| Customer | customer | Cust@123 |

## Recommended demo sequence
1. Login as `employee`, open Learn DPDPA and complete Quiz.
2. Login as `admin`, create a privacy notice (or use the seeded demo notice).
3. Login as `customer`, open Privacy Notice, then Consent Management. Choose Accept/Decline separately for each purpose and save.
4. Withdraw an active consent in Consent Management.
5. Submit a rights request in My Rights Requests.
6. Login as `dpo`, open DPO Review and update a request.
7. Login as `admin`, open Dashboard and Audit Trail; download CSV reports.

## Important
- The SQLite database `knowdpdpa.db` is created automatically the first time the app runs.
- To reset all demo data, stop Streamlit and delete `knowdpdpa.db`. It will be recreated on the next run.
- Demo passwords are for local demonstration only. Change/remove them and implement production-grade authentication before any real deployment.
- This academic prototype is not legal advice, not a government-certified product, and does not establish DPDPA compliance.
