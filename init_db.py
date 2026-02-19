
import sqlite3

# Connect to the database (this will create it if it doesn't exist)
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# --- Create Tables ---

# Sessions Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    machine_type TEXT,
    is_finished BOOLEAN NOT NULL DEFAULT 0,
    ai_summary TEXT
);
''')

# Participants Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    handicap REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);
''')

# Scores Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS scores (
    participant_id TEXT PRIMARY KEY,
    song1 REAL,
    song2 REAL,
    song3 REAL,
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE
);
''')

# Master List Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS master_list (
    name TEXT PRIMARY KEY
);
''')

# --- Initial Data Insertion ---

# Master List
initial_masters = [
  'タカハル', 'ノブコ', 'リサ', 'コウヘイ', 'サヤカ', 
  'ケイスケ', 'リョウ', 'リエ', 'サキ', 'ワタル'
]
cursor.executemany('INSERT OR IGNORE INTO master_list (name) VALUES (?)', [(name,) for name in initial_masters])

# Preset Sessions Data (from your App.tsx)
# Note: Handicap is stored in participants, scores in a separate table.
initial_sessions = [
    {
        'id': 'preset-20250823',
        'date': '2025-08-23T19:00:00.000Z',
        'name': '20250823_カラオケバトル',
        'location': 'カラオケメガビッグ 光明池駅前店',
        'machine_type': 'Livedam Ai',
        'is_finished': True,
        'participants': [
            { 'id': 'preset-takaharu', 'name': 'タカハル', 'handicap': 4.0, 'scores': { 'song1': 86.623, 'song2': 90.585, 'song3': 89.751 } },
            { 'id': 'preset-nobuko', 'name': 'ノブコ', 'handicap': 7.0, 'scores': { 'song1': 80.622, 'song2': 81.429, 'song3': 74.629 } },
            { 'id': 'preset-risa', 'name': 'リサ', 'handicap': 8.0, 'scores': { 'song1': 92.249, 'song2': 86.069, 'song3': 90.254 } },
            { 'id': 'preset-kohei', 'name': 'コウヘイ', 'handicap': 0.0, 'scores': { 'song1': 89.356, 'song2': 90.741, 'song3': 88.494 } },
            { 'id': 'preset-sayaka', 'name': 'サヤカ', 'handicap': 2.0, 'scores': { 'song1': 95.023, 'song2': 92.644, 'song3': 93.693 } },
            { 'id': 'preset-keisuke', 'name': 'ケイスケ', 'handicap': 4.0, 'scores': { 'song1': 89.282, 'song2': 88.329, 'song3': 86.221 } },
            { 'id': 'preset-ryo', 'name': 'リョウ', 'handicap': 1.0, 'scores': { 'song1': 91.872, 'song2': 90.120, 'song3': 87.825 } },
            { 'id': 'preset-rie', 'name': 'リエ', 'handicap': 6.0, 'scores': { 'song1': 88.968, 'song2': 91.530, 'song3': 91.997 } },
            { 'id': 'preset-saki', 'name': 'サキ', 'handicap': 15.0, 'scores': { 'song1': 78.173, 'song2': 74.555, 'song3': 69.405 } },
            { 'id': 'preset-wataru', 'name': 'ワタル', 'handicap': 8.0, 'scores': { 'song1': 79.555, 'song2': 79.082, 'song3': 77.511 } },
        ]
    },
    {
        'id': 'preset-20250101',
        'date': '2025-01-01T13:00:00.000Z',
        'name': '20250101_カラオケバトル',
        'location': 'ラウンドワン ららぽーと和泉店',
        'machine_type': None, # Assuming null if not specified
        'is_finished': True,
        'participants': [
            { 'id': 'preset-0101-takaharu', 'name': 'タカハル', 'handicap': 3.0, 'scores': { 'song1': 89.046, 'song2': 89.609, 'song3': 89.260 } },
            { 'id': 'preset-0101-nobuko', 'name': 'ノブコ', 'handicap': 15.0, 'scores': { 'song1': 87.270, 'song2': 85.965, 'song3': 85.114 } },
            { 'id': 'preset-0101-kohei', 'name': 'コウヘイ', 'handicap': 3.0, 'scores': { 'song1': 92.547, 'song2': 94.540, 'song3': 92.420 } },
            { 'id': 'preset-0101-sayaka', 'name': 'サヤカ', 'handicap': 0.0, 'scores': { 'song1': 91.569, 'song2': 91.153, 'song3': 90.657 } },
            { 'id': 'preset-0101-ryo', 'name': 'リョウ', 'handicap': 4.0, 'scores': { 'song1': 92.082, 'song2': 93.922, 'song3': 91.754 } },
            { 'id': 'preset-0101-rie', 'name': 'リエ', 'handicap': 4.0, 'scores': { 'song1': 86.729, 'song2': 88.888, 'song3': 85.999 } },
            { 'id': 'preset-0101-wataru', 'name': 'ワタル', 'handicap': 15.0, 'scores': { 'song1': 90.070, 'song2': 79.051, 'song3': 85.724 } },
        ]
    },
    {
        'id': 'preset-20240427',
        'date': '2024-04-27T13:00:00.000Z',
        'name': '20240427_カラオケバトル',
        'location': 'ラウンドワン ららぽーと和泉店',
        'machine_type': '不明',
        'is_finished': True,
        'participants': [
            { 'id': 'preset-0427-takaharu', 'name': 'タカハル', 'handicap': 5.0, 'scores': { 'song1': 87.089, 'song2': 91.294, 'song3': 92.057 } },
            { 'id': 'preset-0427-nobuko', 'name': 'ノブコ', 'handicap': 12.0, 'scores': { 'song1': 80.312, 'song2': 80.768, 'song3': 79.809 } },
            { 'id': 'preset-0427-risa', 'name': 'リサ', 'handicap': 8.0, 'scores': { 'song1': 89.328, 'song2': 94.058, 'song3': 89.946 } },
            { 'id': 'preset-0427-kohei', 'name': 'コウヘイ', 'handicap': 3.0, 'scores': { 'song1': 90.745, 'song2': 94.486, 'song3': 87.578 } },
            { 'id': 'preset-0427-sayaka', 'name': 'サヤカ', 'handicap': 0.0, 'scores': { 'song1': 94.187, 'song2': 91.208, 'song3': 92.454 } },
            { 'id': 'preset-0427-keisuke', 'name': 'ケイスケ', 'handicap': 4.0, 'scores': { 'song1': 85.138, 'song2': 85.747, 'song3': 86.586 } },
            { 'id': 'preset-0427-ryo', 'name': 'リョウ', 'handicap': 0.0, 'scores': { 'song1': 91.165, 'song2': 89.826, 'song3': 88.389 } },
            { 'id': 'preset-0427-rie', 'name': 'リエ', 'handicap': 5.0, 'scores': { 'song1': 87.768, 'song2': 86.791, 'song3': 88.443 } },
            { 'id': 'preset-0427-saki', 'name': 'サキ', 'handicap': 20.0, 'scores': { 'song1': 76.768, 'song2': 72.264, 'song3': 77.025 } },
            { 'id': 'preset-0427-wataru', 'name': 'ワタル', 'handicap': 20.0, 'scores': { 'song1': 79.347, 'song2': 0, 'song3': 0 } },
        ]
    },
    {
        'id': 'preset-20240223',
        'date': '2024-02-23T13:00:00.000Z',
        'name': '20240223_カラオケバトル',
        'location': 'ラウンドワン ららぽーと和泉店',
        'machine_type': '不明',
        'is_finished': True,
        'participants': [
            { 'id': 'preset-0223-takaharu', 'name': 'タカハル', 'handicap': 5.0, 'scores': { 'song1': 89.663, 'song2': 81.754, 'song3': 87.771 } },
            { 'id': 'preset-0223-nobuko', 'name': 'ノブコ', 'handicap': 15.0, 'scores': { 'song1': 75.325, 'song2': 82.331, 'song3': 82.984 } },
            { 'id': 'preset-0223-kohei', 'name': 'コウヘイ', 'handicap': 0.0, 'scores': { 'song1': 88.787, 'song2': 86.543, 'song3': 91.160 } },
            { 'id': 'preset-0223-sayaka', 'name': 'サヤカ', 'handicap': 1.0, 'scores': { 'song1': 91.661, 'song2': 92.308, 'song3': 90.308 } },
            { 'id': 'preset-0223-keisuke', 'name': 'ケイスケ', 'handicap': 11.0, 'scores': { 'song1': 89.030, 'song2': 90.007, 'song3': 82.990 } },
            { 'id': 'preset-0223-risa', 'name': 'リサ', 'handicap': 5.0, 'scores': { 'song1': 87.841, 'song2': 81.127, 'song3': 82.941 } },
            { 'id': 'preset-0223-ryo', 'name': 'リョウ', 'handicap': 5.0, 'scores': { 'song1': 93.272, 'song2': 93.653, 'song3': 88.412 } },
            { 'id': 'preset-0223-rie', 'name': 'リエ', 'handicap': 10.0, 'scores': { 'song1': 85.751, 'song2': 89.740, 'song3': 84.310 } },
            { 'id': 'preset-0223-saki', 'name': 'サキ', 'handicap': 20.0, 'scores': { 'song1': 75.186, 'song2': 67.971, 'song3': 69.078 } },
            { 'id': 'preset-0223-wataru', 'name': 'ワタル', 'handicap': 20.0, 'scores': { 'song1': 0, 'song2': 0, 'song3': 0 } },
        ]
    },
]

for session_data in initial_sessions:
    # Insert into sessions table
    cursor.execute(
        'INSERT OR REPLACE INTO sessions (id, date, name, location, machine_type, is_finished) VALUES (?, ?, ?, ?, ?, ?)',
        (
            session_data['id'],
            session_data['date'],
            session_data['name'],
            session_data.get('location'),
            session_data.get('machine_type'),
            session_data['is_finished'],
        )
    )
    
    # Insert participants and scores
    for p_data in session_data['participants']:
        cursor.execute(
            'INSERT OR REPLACE INTO participants (id, session_id, name, handicap) VALUES (?, ?, ?, ?)',
            (p_data['id'], session_data['id'], p_data['name'], p_data['handicap'])
        )
        
        scores = p_data['scores']
        cursor.execute(
            'INSERT OR REPLACE INTO scores (participant_id, song1, song2, song3) VALUES (?, ?, ?, ?)',
            (p_data['id'], scores.get('song1'), scores.get('song2'), scores.get('song3'))
        )

# --- Commit and Close ---

conn.commit()
conn.close()

print("Database 'database.db' initialized successfully.")

