"""
Solo Leveling Fitness System — 100-Day Hunter Progress Tracker
Backend with MongoDB Atlas persistence, User Auth, and Phase-Based Daily Quests.
"""

import os
import random
from datetime import datetime
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import bcrypt
from werkzeug.security import check_password_hash
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# MongoDB & Flask Config
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "solo_leveling_default_secret")
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.get_database("hunter_system")
users_collection = db.get_collection("users")

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin):
    def __init__(self, user_id, username):
        self.id = user_id
        self.username = username

@login_manager.user_loader
def load_user(user_id):
    u = users_collection.find_one({"username": user_id})
    if not u:
        return None
    return User(u["username"], u["username"])

# ---------------------------------------------------------------------------
# 100-Day Phase System
# ---------------------------------------------------------------------------

EXERCISE_PHASES = {
    1: {
        "title": "The Re-Awakening",
        "days": "Days 1–30",
        "focus": "Weight loss (hips), building the foundation for push-ups and pull-ups",
        "quests": [
            {"id": 1, "label": "Incline Push-ups", "sub": "4 sets to failure − 2 reps"},
            {"id": 2, "label": "Incline Rows + Dead Hang", "sub": "4 × 10 rows + 30s hang"},
            {"id": 3, "label": "Leg Circuit", "sub": "3 × 20 Squats + 15 Lunges/leg"},
            {"id": 4, "label": "Treadmill Run: 2 km", "sub": "At 8 km/h · No stopping"},
        ],
    },
    2: {
        "title": "The Hunter's Growth",
        "days": "Days 31–70",
        "focus": "Muscle hypertrophy & stamina to shred hip fat",
        "quests": [
            {"id": 1, "label": "Floor Push-ups", "sub": "4 sets · Max reps"},
            {"id": 2, "label": "Negative Pull-ups", "sub": "4 sets · 5s slow lower"},
            {"id": 3, "label": "Core Circuit", "sub": "3 × 1-min Plank + 20 Leg Raises"},
            {"id": 4, "label": "Treadmill Run: 3.5 km", "sub": "At 9 km/h"},
        ],
    },
    3: {
        "title": "Limit Break",
        "days": "Days 71–100",
        "focus": "Definition, explosive power, peak cardiovascular health",
        "quests": [
            {"id": 1, "label": "Diamond + Pike Push-ups", "sub": "4 sets each · Definition & shoulders"},
            {"id": 2, "label": "Pull-ups", "sub": "4 sets · Aim 5+ reps/set"},
            {"id": 3, "label": "Explosive Legs", "sub": "3 × 15 Jump Squats + 20 Bulgarian Splits"},
            {"id": 4, "label": "Treadmill 5 km / HIIT", "sub": "Sprint 12 km/h · 1min on/1min off · 20 min"},
        ],
    },
}

# Gradual rank progression: E → D → C → B → A → S across 100 days
RANK_PROGRESSION = [
    (1,  "E-Rank"),
    (17, "D-Rank"),
    (34, "C-Rank"),
    (51, "B-Rank"),
    (68, "A-Rank"),
    (85, "S-Rank"),
]

RANK_GATES = {
    17: {"from": "E-Rank", "to": "D-Rank", "req": "Complete 16 consecutive daily quests"},
    34: {"from": "D-Rank", "to": "C-Rank", "req": "Perform 10 clean floor push-ups"},
    51: {"from": "C-Rank", "to": "B-Rank", "req": "Hold a 60-second plank + 30 push-ups"},
    68: {"from": "B-Rank", "to": "A-Rank", "req": "Perform 1 strict dead-hang pull-up"},
    85: {"from": "A-Rank", "to": "S-Rank", "req": "5 pull-ups + 50 push-ups in one session"},
    100: {"from": "S-Rank", "to": "MONARCH", "req": "FINAL BOSS: 100 Push-ups, 100 Squats, 10 km Run"},
}

def _rank_for_day(day):
    """Determine hunter rank based on current day."""
    rank = "E-Rank"
    for threshold, title in RANK_PROGRESSION:
        if day >= threshold:
            rank = title
    return rank

def _get_next_gate(day):
    """Get the next rank-up gate info for the given day."""
    for gate_day in sorted(RANK_GATES.keys()):
        if day <= gate_day:
            return gate_day, RANK_GATES[gate_day]
    return 100, RANK_GATES[100]

def _get_current_phase(day):
    """Build the full phase info for a given day."""
    # Exercise phase
    if day <= 30:
        ex = EXERCISE_PHASES[1]
        phase_id = 1
    elif day <= 70:
        ex = EXERCISE_PHASES[2]
        phase_id = 2
    else:
        ex = EXERCISE_PHASES[3]
        phase_id = 3

    rank = _rank_for_day(day)
    next_gate_day, next_gate = _get_next_gate(day)

    return {
        "phase_id": phase_id,
        "rank": rank,
        "title": ex["title"],
        "days": ex["days"],
        "focus": ex["focus"],
        "quests": ex["quests"],
        "levelup_day": next_gate_day,
        "levelup_req": next_gate["req"],
        "next_rank": next_gate["to"],
        "current_rank": rank,
    }


# ---------------------------------------------------------------------------
# Game Constants & Logic
# ---------------------------------------------------------------------------

RANK_THRESHOLDS = [
    (1,  "E-Rank"), (5,  "D-Rank"), (10, "C-Rank"),
    (20, "B-Rank"), (35, "A-Rank"), (50, "S-Rank"),
    (75, "National-Level"), (90, "Monarch"),
]

ABILITY_UNLOCKS = {
    5:  "Floor Pushups — Unlock decline push-ups for bonus STR",
    10: "Sprint Burst — Unlock sprinting intervals for bonus AGI",
    15: "Iron Skin — Unlock plank holds for bonus VIT",
    20: "Shadow Step — Unlock jump squats for bonus AGI",
    25: "Ruler's Authority — Unlock weighted exercises for all stats",
    30: "Arise — Unlock shadow-army partner workouts",
    50: "Domain Expansion — Unlock full-body advanced routines",
    75: "Kamish's Wrath — Unlock extreme endurance challenges",
}

SPECIAL_QUESTS = [
    {"id": "talk", "title": "Social Link", "desc": "Initiate a conversation with a stranger or reconnect with an old friend.", "category": "COMMUNICATION"},
    {"id": "sport", "title": "Athletic Prowess", "desc": "Play a sport or run 2km extra at a high pace.", "category": "SPORT"},
    {"id": "study", "title": "Forbidden Knowledge", "desc": "Read 20 pages of a book or learn a new technical skill.", "category": "INTELLECT"},
    {"id": "explore", "title": "Dungeon Scouting", "desc": "Explore a part of your city you've never visited before.", "category": "EXPLORATION"},
    {"id": "help", "title": "Protector Mode", "desc": "Help someone in need or perform an act of kindness.", "category": "EMPATHY"},
]

SPECIAL_ITEMS = [
    {"id": "ring", "name": "Monarch's Ring", "icon": "ring", "rarity": "LEGENDARY", "bonus": "+2 All Stats"},
    {"id": "key", "name": "Cartenon Key", "icon": "key", "rarity": "EPIC", "bonus": "Unknown Power"},
    {"id": "elixir", "name": "Elixir of Life", "icon": "potion", "rarity": "RARE", "bonus": "+10 VIT"},
    {"id": "essence", "name": "Magic Essence", "icon": "crystal", "rarity": "RARE", "bonus": "+10 INT"},
    {"id": "scroll", "name": "Recovery Scroll", "icon": "scroll", "rarity": "UNCOMMON", "bonus": "Reset Fatigue"},
]

TITLES = {
    "weakest": {"id": "weakest", "name": "The Weakest Hunter", "desc": "Began the journey.", "rarity": "COMMON"},
    "demon_slayer": {"id": "demon_slayer", "name": "Demon Slayer", "desc": "Reached Level 25.", "rarity": "UNCOMMON"},
    "tenacious": {"id": "tenacious", "name": "Tenacious", "desc": "Reached a 30-day streak.", "rarity": "RARE"},
    "shadow_monarch": {"id": "shadow_monarch", "name": "Shadow Monarch", "desc": "Reached Level 50.", "rarity": "EPIC"},
    "national_level": {"id": "national_level", "name": "National-Level", "desc": "Reached Level 75.", "rarity": "LEGENDARY"}
}

DEFAULT_STATS = {"STR": 5, "INT": 20, "AGI": 5, "VIT": 10, "WIL": 10}
XP_PER_DAILY = 10
STREAK_BONUS_EVERY = 7
STREAK_BONUS_XP = 25
POINTS_PER_LEVEL = 5

SHADOW_MILESTONES = {
    10: {"id": "igris", "name": "IGRIS THE RED", "icon": "knight"},
    20: {"id": "tank", "name": "TANK", "icon": "beast"},
    30: {"id": "iron", "name": "IRON", "icon": "shield"},
    40: {"id": "kaisel", "name": "KAISEL", "icon": "dragon"},
    50: {"id": "beru", "name": "BERU", "icon": "ant"},
    75: {"id": "greed", "name": "GREED", "icon": "mage"},
    90: {"id": "bellion", "name": "BELLION", "icon": "king"},
}

def _get_default_profile(username):
    return {
        "username": username,
        "hunter_name": username,
        "rank": "E-Rank",
        "level": 1,
        "xp": 0,
        "xp_to_next": 100,
        "stats": DEFAULT_STATS.copy(),
        "stat_points": 0,
        "daily_completed_streak": 0,
        "quest_history": [],
        "abilities_unlocked": [],
        "shadow_army": [],
        "inventory": [],
        "last_completion": None,
        "special_quest": None, # { id, accepted, completed_today }
        "last_red_gate": None,
        "red_gate_active": False,
        "unlocked_titles": ["weakest"],
        "active_title": "weakest"
    }

def _rank_for_level(level):
    rank = "E-Rank"
    for threshold, title in RANK_THRESHOLDS:
        if level >= threshold:
            rank = title
    return rank

def _apply_stat_gains(stats):
    weighted_stats = ["STR", "AGI", "STR", "AGI", "VIT", "WIL", "INT"]
    picks = random.sample(weighted_stats, k=3)
    for stat in picks:
        stats[stat] = stats.get(stat, 0) + random.randint(1, 3)
    return stats

def _check_ability_unlock(level, abilities):
    if level in ABILITY_UNLOCKS:
        ability = ABILITY_UNLOCKS[level]
        if ability not in abilities:
            abilities.append(ability)
    return abilities

def _process_level_up(data):
    while data["xp"] >= data["xp_to_next"]:
        data["xp"] -= data["xp_to_next"]
        data["level"] += 1
        data["xp_to_next"] = int(data["xp_to_next"] * 1.10)
        # Award stat points instead of random gains
        data["stat_points"] = data.get("stat_points", 0) + POINTS_PER_LEVEL
        data["abilities_unlocked"] = _check_ability_unlock(data["level"], data.get("abilities_unlocked", []))
        
        # Shadow Army Unlock
        if data["level"] in SHADOW_MILESTONES:
            shadow = SHADOW_MILESTONES[data["level"]]
            if shadow not in data.get("shadow_army", []):
                data.setdefault("shadow_army", []).append(shadow)

    data["rank"] = _rank_for_level(data["level"])
    return data

# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400
    if users_collection.find_one({"username": username}):
        return jsonify({"success": False, "error": "User already exists"}), 400
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user_doc = _get_default_profile(username)
    user_doc["password"] = hashed_pw
    users_collection.insert_one(user_doc)
    return jsonify({"success": True, "message": "User registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    user_doc = users_collection.find_one({"username": username})
    
    if user_doc:
        db_pw = user_doc.get("password", "")
        valid = False
        
        if isinstance(db_pw, bytes):
            try:
                valid = bcrypt.checkpw(password.encode("utf-8"), db_pw)
            except Exception:
                pass
        elif isinstance(db_pw, str):
            if db_pw.startswith("pbkdf2:") or db_pw.startswith("scrypt:"):
                valid = check_password_hash(db_pw, password)
            else:
                try:
                    valid = bcrypt.checkpw(password.encode("utf-8"), db_pw.encode("utf-8"))
                except Exception:
                    pass
        else:
            valid = False
            
        if valid:
            login_user(User(username, username))
            return jsonify({"success": True, "message": "Logged in", "username": username})
            
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logged out"})

@app.route("/api/check-auth")
def check_auth():
    if current_user.is_authenticated:
        return jsonify({"logged_in": True, "username": current_user.username})
    return jsonify({"logged_in": False})

# ---------------------------------------------------------------------------
# Game Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/health")
def health_check():
    return jsonify({"status": "active"}), 200

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status", methods=["GET"])
@login_required
def get_status():
    user_doc = users_collection.find_one({"username": current_user.id}, {"password": 0, "_id": 0})
    
    # Penalty Check: Reset streak if > 48h since last completion
    if user_doc.get("last_completion") and user_doc.get("daily_completed_streak", 0) > 0:
        last_dt = datetime.fromisoformat(user_doc["last_completion"].replace("Z", ""))
        diff = datetime.utcnow() - last_dt
        if diff.total_seconds() > (48 * 3600):
            # Penalty! Reset streak
            user_doc["daily_completed_streak"] = 0
            user_doc["xp"] = max(0, user_doc.get("xp", 0) - 50)
            users_collection.update_one({"username": current_user.id}, {"$set": {
                "daily_completed_streak": 0,
                "xp": user_doc["xp"]
            }})

    # Title Mechanics & Red Gate
    needs_update = False
    
    # 1. Passive Title Check
    if "unlocked_titles" not in user_doc:
        user_doc["unlocked_titles"] = ["weakest"]
        needs_update = True
    if "active_title" not in user_doc:
        user_doc["active_title"] = "weakest"
        needs_update = True
        
    ulist = set(user_doc["unlocked_titles"])
    lvl = user_doc.get("level", 1)
    strk = user_doc.get("daily_completed_streak", 0)
    
    if lvl >= 25 and "demon_slayer" not in ulist:
        ulist.add("demon_slayer")
        needs_update = True
    if lvl >= 50 and "shadow_monarch" not in ulist:
        ulist.add("shadow_monarch")
        needs_update = True
    if lvl >= 75 and "national_level" not in ulist:
        ulist.add("national_level")
        needs_update = True
    if strk >= 30 and "tenacious" not in ulist:
        ulist.add("tenacious")
        needs_update = True
        
    if needs_update:
        user_doc["unlocked_titles"] = list(ulist)
        # Pass update flag, but we'll do one bulk update below
        
    # 2. Daily Red Gate Trigger (Weekly)
    if not user_doc.get("red_gate_active"):
        if not user_doc.get("last_red_gate") and strk >= 7:
            # First red gate unlocks on day 7
            user_doc["red_gate_active"] = True
            needs_update = True
        elif user_doc.get("last_red_gate"):
            last_rg = datetime.fromisoformat(user_doc["last_red_gate"].replace("Z", ""))
            if (datetime.utcnow() - last_rg).total_seconds() > (7 * 24 * 3600):
                user_doc["red_gate_active"] = True
                needs_update = True
                
    if needs_update:
        users_collection.update_one({"username": current_user.id}, {"$set": {
            "unlocked_titles": user_doc["unlocked_titles"],
            "active_title": user_doc["active_title"],
            "red_gate_active": user_doc["red_gate_active"]
        }})

    # Attach rich title info
    user_doc["resolved_titles"] = [TITLES.get(t) for t in user_doc["unlocked_titles"] if t in TITLES]
    active_t = TITLES.get(user_doc.get("active_title", "weakest"))
    user_doc["active_title_display"] = active_t["name"] if active_t else "The Weakest Hunter"

    # Attach phase info
    day = user_doc.get("daily_completed_streak", 0) + 1  # next day to complete
    phase = _get_current_phase(day)
    user_doc["current_phase"] = phase
    user_doc["current_day"] = day
    return jsonify(user_doc)

@app.route("/api/complete-daily", methods=["POST"])
@login_required
def complete_daily():
    payload = request.get_json(silent=True) or {}
    data = users_collection.find_one({"username": current_user.id})

    data["daily_completed_streak"] += 1
    streak = data["daily_completed_streak"]

    # Determine which phase this completion falls in
    phase = _get_current_phase(streak)

    xp_earned = XP_PER_DAILY
    streak_bonus = 0
    if streak % STREAK_BONUS_EVERY == 0:
        streak_bonus = STREAK_BONUS_XP
        xp_earned += streak_bonus

    # Rank gate milestone bonus XP
    phase_milestone = False
    if streak in RANK_GATES:
        xp_earned += 50  # Big milestone bonus
        phase_milestone = True

    data["xp"] += xp_earned
    old_level = data["level"]
    data = _process_level_up(data)
    new_level = data["level"]
    levelled_up = new_level > old_level

    entry = {
        "day": streak,
        "date": datetime.utcnow().isoformat() + "Z",
        "phase": phase["rank"],
        "xp_earned": xp_earned,
        "streak_bonus": streak_bonus,
        "levelled_up": levelled_up,
    }
    data["quest_history"].append(entry)
    data["last_completion"] = datetime.utcnow().isoformat() + "Z"

    # Trigger Special Quest Chance (50%) if not already completed/active today
    special_trigger = False
    if not data.get("special_quest") or not data["special_quest"].get("completed_today"):
        if random.random() < 0.5:
            sq = random.choice(SPECIAL_QUESTS)
            data["special_quest"] = {
                "id": sq["id"],
                "title": sq["title"],
                "desc": sq["desc"],
                "category": sq["category"],
                "accepted": False,
                "completed_today": False
            }
            special_trigger = True

    users_collection.update_one({"username": current_user.id}, {"$set": data})

    response = {
        "success": True,
        "message": "Daily quest completed!",
        "xp_earned": xp_earned,
        "streak": streak,
        "level": data["level"],
        "rank": data["rank"],
        "phase": phase["rank"],
        "special_trigger": special_trigger,
        "special_quest_data": data.get("special_quest") if special_trigger else None
    }
    
    if streak_bonus:
        response["streak_bonus"] = f"+{streak_bonus} XP for {streak}-day streak!"
    if levelled_up:
        response["level_up"] = f"🎉 LEVEL UP! You are now Level {new_level}."
    if phase_milestone:
        response["phase_milestone"] = f"🏆 PHASE MILESTONE! Day {streak} complete — +50 bonus XP!"
        if streak < 100:
            next_phase = _get_current_phase(streak + 1)
            response["phase_unlock"] = f"You've unlocked {next_phase['rank']}: {next_phase['title']}!"
        else:
            response["final_boss"] = "⚔️ THE FINAL BOSS HAS BEEN CONQUERED! You are a true MONARCH!"
    return jsonify(response)

@app.route("/api/reset", methods=["POST"])
@login_required
def reset_profile():
    new_profile = _get_default_profile(current_user.id)
    users_collection.update_one({"username": current_user.id}, {"$set": new_profile})
    return jsonify({"success": True, "message": "Profile reset to defaults."})

@app.route("/api/assign-stats", methods=["POST"])
@login_required
def assign_stats():
    data = request.get_json()
    stat_key = data.get("stat")
    if stat_key not in DEFAULT_STATS:
        return jsonify({"success": False, "error": "Invalid stat"}), 400
    
    user_doc = users_collection.find_one({"username": current_user.id})
    if user_doc.get("stat_points", 0) <= 0:
        return jsonify({"success": False, "error": "No stat points available"}), 400
    
    user_doc["stats"][stat_key] += 1
    user_doc["stat_points"] -= 1
    
    users_collection.update_one({"username": current_user.id}, {"$set": user_doc})
    return jsonify({"success": True, "stats": user_doc["stats"], "stat_points": user_doc["stat_points"]})

@app.route("/api/accept-special-quest", methods=["POST"])
@login_required
def accept_special():
    user_doc = users_collection.find_one({"username": current_user.id})
    if user_doc.get("special_quest"):
        user_doc["special_quest"]["accepted"] = True
        users_collection.update_one({"username": current_user.id}, {"$set": {"special_quest": user_doc["special_quest"]}})
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "No special quest available"}), 400

@app.route("/api/complete-special-quest", methods=["POST"])
@login_required
def complete_special():
    user_doc = users_collection.find_one({"username": current_user.id})
    if user_doc.get("special_quest") and user_doc["special_quest"]["accepted"]:
        # Award special item
        item = random.choice(SPECIAL_ITEMS).copy()
        item["earned_at"] = datetime.utcnow().isoformat() + "Z"
        user_doc.setdefault("inventory", []).append(item)
        
        # Mark as completed
        user_doc["special_quest"]["completed_today"] = True
        user_doc["special_quest"]["accepted"] = False
        
        users_collection.update_one({"username": current_user.id}, {"$set": {
            "inventory": user_doc["inventory"],
            "special_quest": user_doc["special_quest"]
        }})
        return jsonify({"success": True, "item": item})
    return jsonify({"success": False, "error": "No active special quest"}), 400

@app.route("/api/change-title", methods=["POST"])
@login_required
def change_title():
    data = request.get_json()
    new_title = data.get("title_id")
    user_doc = users_collection.find_one({"username": current_user.id})
    if new_title in user_doc.get("unlocked_titles", []):
        users_collection.update_one({"username": current_user.id}, {"$set": {"active_title": new_title}})
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Title not unlocked"}), 400

@app.route("/api/complete-red-gate", methods=["POST"])
@login_required
def complete_red_gate():
    user_doc = users_collection.find_one({"username": current_user.id})
    if not user_doc.get("red_gate_active"):
        return jsonify({"success": False, "error": "No Red Gate active."}), 400
        
    # Massive Rewards
    user_doc["xp"] = user_doc.get("xp", 0) + 200
    user_doc["last_red_gate"] = datetime.utcnow().isoformat() + "Z"
    user_doc["red_gate_active"] = False
    
    # Rare Item Reward
    rare_items = [i for i in SPECIAL_ITEMS if i["rarity"] in ("EPIC", "LEGENDARY")]
    if not rare_items: 
        rare_items = SPECIAL_ITEMS
    item = random.choice(rare_items).copy()
    item["earned_at"] = datetime.utcnow().isoformat() + "Z"
    user_doc.setdefault("inventory", []).append(item)
    
    # Process level up
    user_doc = _process_level_up(user_doc)
    
    users_collection.update_one({"username": current_user.id}, {"$set": user_doc})
    return jsonify({
        "success": True, 
        "message": "RED GATE CLEARED!",
        "item": item,
        "level": user_doc["level"],
        "rank": user_doc["rank"]
    })

@app.route("/leaderboard")
def leaderboard_page():
    return render_template("leaderboard.html")

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    # Sort by level descending, then xp descending
    users_cursor = users_collection.find({}, {"password": 0, "_id": 0}).sort([("level", -1), ("xp", -1)]).limit(100)
    leaderboard = []
    rank_count = 1
    for u in users_cursor:
        leaderboard.append({
            "lb_rank": rank_count,
            "hunter_name": u.get("hunter_name", u.get("username")),
            "hunter_rank": u.get("rank", "E-Rank"),
            "level": u.get("level", 1),
            "xp": u.get("xp", 0)
        })
        rank_count += 1
    return jsonify({"success": True, "leaderboard": leaderboard})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
