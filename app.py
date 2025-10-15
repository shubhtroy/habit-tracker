from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os



app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')

# You probably have a similar line for this already, but make sure it's there
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config.from_object(Config)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

class Habit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

# --- Create Database Tables ---
with app.app_context():
    db.create_all()

@app.route('/api/habits/<int:habit_id>', methods=['PUT'])
@jwt_required()
def update_habit(habit_id):
    current_user_id = get_jwt_identity()
    habit_to_update = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    habit_to_update.name = data['name']
    db.session.commit()
    return jsonify(habit_to_update.to_dict())
# --- Authentication Routes ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token)
    return jsonify({"message": "Invalid credentials"}), 401

# --- Main Page Route ---
@app.route('/')
def home():
    return render_template('index.html')

# --- Protected API Routes ---
@app.route('/api/habits', methods=['GET'])
@jwt_required()
def get_habits():
    current_user_id = get_jwt_identity()
    habits = Habit.query.filter_by(user_id=current_user_id).all()
    habits_list = [habit.to_dict() for habit in habits]
    return jsonify(habits_list)

@app.route('/api/habits', methods=['POST'])
@jwt_required()
def add_habit():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_habit = Habit(name=data['name'], user_id=current_user_id)
    db.session.add(new_habit)
    db.session.commit()
    return jsonify(new_habit.to_dict()), 201

@app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
@jwt_required()
def delete_habit(habit_id):
    current_user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first_or_404()
    db.session.delete(habit)
    db.session.commit()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)