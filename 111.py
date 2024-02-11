from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

# SQLite database setup
conn = sqlite3.connect(':memory:', check_same_thread=False)
conn.execute('''
    CREATE TABLE logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        message TEXT,
        resourceId TEXT,
        timestamp TEXT,
        traceId TEXT,
        spanId TEXT,
        "commit" TEXT,
        parentResourceId TEXT
    )
''')


conn.commit()

@app.route('/ingest', methods=['POST'])
def ingest_log():
    log_data = request.get_json()
    conn.execute('''
        INSERT INTO logs (level, message, resourceId, timestamp, traceId, spanId, commit, parentResourceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        log_data['level'],
        log_data['message'],
        log_data['resourceId'],
        log_data['timestamp'],
        log_data['traceId'],
        log_data['spanId'],
        log_data['commit'],
        log_data['metadata']['parentResourceId'] if 'metadata' in log_data else None
    ))
    conn.commit()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(port=3000)
