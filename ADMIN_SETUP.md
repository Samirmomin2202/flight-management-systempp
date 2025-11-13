# How to Become an Admin User

## Method 1: Create Admin User via Script (Recommended)

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Run the Admin Creation Script
```bash
node scripts/create-admin.js <email> <password> [username] [surname]
```

### Example:
```bash
node scripts/create-admin.js admin@flighthub.com admin123 Admin User
```

This will:
- Create a new admin user in MongoDB with `role: "admin"`
- Or update an existing user to admin if the email already exists
- Hash the password securely

### Step 3: Login as Admin

1. Go to the login page: `http://localhost:5173/login`
2. Enter your **username/email** (the one you used when creating admin)
3. Enter password: **"admin"** (exactly "admin" - this triggers admin login)
4. Click "Login Now"

The system will:
- Detect password is "admin"
- Fetch admin user from MongoDB
- Log you in as admin
- Redirect you to `/admin/dashboard`

---

## Method 2: Manual MongoDB Setup

If you prefer to create admin directly in MongoDB:

1. Connect to your MongoDB database
2. Insert a user document with `role: "admin"`:

```javascript
db.users.insertOne({
  username: "Admin",
  surname: "User",
  email: "admin@flighthub.com",
  password: "$2a$10$hashedPasswordHere", // Use bcrypt hash
  role: "admin"
})
```

**Note:** You'll need to hash the password using bcrypt. The script does this automatically.

---

## Method 3: Update Existing User to Admin

If you already have a user account and want to make it admin:

### Option A: Using the Script
```bash
cd backend
node scripts/create-admin.js your-email@example.com your-password YourName Surname
```

This will update the existing user to admin role.

### Option B: Direct MongoDB Update
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

---

## Login Instructions

### Quick Admin Login:
1. **Username/Email**: Any admin user's email or username from database
2. **Password**: Exactly **"admin"** (this is the magic password)

### Important Notes:
- The password "admin" is a special trigger - it doesn't check the actual password hash
- It finds any user with `role: "admin"` in the database
- If multiple admins exist, it will use the first one found (or match by email/username if provided)
- After login, you'll be redirected to `/admin/dashboard`

---

## Admin Dashboard Access

Once logged in as admin, you can access:
- `/admin/dashboard` - Admin dashboard
- `/admin/flights` - Flight management
- `/admin/bookings` - Booking management
- `/admin/users` - User management
- `/admin/reports` - Reports and analytics
- `/admin/contacts` - Contact messages

---

## Troubleshooting

### "No admin user found in database"
- Make sure you've created an admin user first using the script
- Check MongoDB connection in `.env` file
- Verify the user has `role: "admin"` in the database

### "Access denied. Admin privileges required"
- Ensure the user in database has `role: "admin"` (not "user")
- Try logging in again with password "admin"

### Script not working
- Make sure MongoDB is running
- Check `.env` file has correct `MONGO_URI`
- Ensure you're in the `backend` directory when running the script

---

## Security Note

⚠️ **Important**: The password "admin" is a special bypass for admin login. In production, you should:
- Use stronger authentication
- Consider removing this bypass
- Use proper role-based access control (RBAC)
- Implement proper admin approval workflows


