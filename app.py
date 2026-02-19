
from flask import Flask, jsonify, request
import sqlite3

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    conn = get_db_connection()
    sessions = conn.execute('SELECT * FROM sessions').fetchall()
    conn.close()
    return jsonify([dict(session) for session in sessions])

if __name__ == '__main__':
    app.run(debug=True)
