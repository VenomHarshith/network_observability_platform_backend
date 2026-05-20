\# Network Observability Platform (NOP)



Real-time network monitoring using:

\- Scapy Packet Capture Agent

\- FastAPI Metrics + ML (Isolation Forest)

\- React Live Dashboard



\## Project Structure



agent/      → packet capture using Scapy  

backend/    → FastAPI metrics server  

frontend/   → React dashboard  



\## How to Run



\### Terminal 1 — Agent

cd agent

python packet\_agent.py



\### Terminal 2 — Backend

cd backend

python -m venv venv

venv\\Scripts\\activate

pip install -r requirements.txt

uvicorn final\_stream:app --reload



\### Terminal 3 — Frontend

cd frontend

npm install

npm start



