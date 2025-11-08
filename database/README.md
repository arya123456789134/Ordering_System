# Database Files for Food Ordering System

This directory contains all the database-related files for the Food Ordering System.

## Files Included

### 1. `ordering_system.sql`
- **Complete SQL dump** of the database
- Contains all table structures, relationships, and sample data
- Can be imported directly into MySQL
- Includes sample food items and admin user

### 2. `import_database.php`
- **PHP script** to automatically import the database
- Handles errors gracefully
- Provides detailed feedback during import
- Shows database contents after import

### 3. `import_database.bat`
- **Windows batch file** for easy database import
- Automatically detects MySQL installation
- Works with XAMPP MySQL
- Provides user-friendly error messages

## Quick Setup Options

### Option 1: Using PHP Script (Recommended)
```bash
php database/import_database.php
```

### Option 2: Using Batch File (Windows)
```bash
database/import_database.bat
```

### Option 3: Manual Import
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Create new database: `ordering_system`
3. Import file: `database/ordering_system.sql`

## Database Structure

### Tables Created

#### 1. `foods` Table
- **Purpose**: Stores food menu items
- **Fields**:
  - `id` (Primary Key)
  - `name` (Food item name)
  - `category` (Food category)
  - `price` (Item price)
  - `image` (Base64 encoded image)
  - `created_at` (Timestamp)

#### 2. `orders` Table
- **Purpose**: Stores order information
- **Fields**:
  - `id` (Primary Key)
  - `tracking_number` (Unique order tracking)
  - `customer_name` (Customer name)
  - `total_amount` (Order total)
  - `status` (pending/ready/completed)
  - `created_at` (Timestamp)

#### 3. `order_items` Table
- **Purpose**: Stores individual items in orders
- **Fields**:
  - `id` (Primary Key)
  - `order_id` (Foreign Key to orders)
  - `food_id` (Foreign Key to foods)
  - `quantity` (Item quantity)
  - `price` (Item price at time of order)

#### 4. `admin` Table
- **Purpose**: Stores admin user credentials
- **Fields**:
  - `id` (Primary Key)
  - `username` (Admin username)
  - `password` (Hashed password)
  - `created_at` (Timestamp)

## Sample Data Included

### Food Items (8 items)
- **Shakes**: Chocolate, Vanilla, Strawberry
- **Snacks**: French Fries, Chicken Wings
- **Main Course**: Burger, Pizza Slice
- **Healthy**: Salad

### Admin User
- **Username**: admin
- **Password**: 1234 (hashed with bcrypt)

### Sample Orders
- 2 sample orders with different statuses
- Demonstrates order tracking functionality

## Database Features

### Indexes for Performance
- Category index on foods table
- Status index on orders table
- Created date index on orders table
- Foreign key indexes on order_items table

### Data Integrity
- Foreign key constraints
- Cascade delete for order items
- Unique constraints on tracking numbers
- Proper data types and lengths

### Security
- Password hashing with bcrypt
- SQL injection protection with prepared statements
- Input validation in PHP backend

## Troubleshooting

### Common Issues

1. **"Database already exists"**
   - This is normal if you've run the import before
   - The script will skip existing tables

2. **"Access denied for user 'root'"**
   - Make sure MySQL is running in XAMPP
   - Check if password is required (some XAMPP installations have no password)

3. **"Table doesn't exist"**
   - Run the import script again
   - Check MySQL error logs

### Manual Database Reset
If you need to reset the database:
```sql
DROP DATABASE IF EXISTS ordering_system;
```
Then run the import script again.

## Backup and Restore

### Creating Backup
```bash
mysqldump -u root -p ordering_system > backup.sql
```

### Restoring from Backup
```bash
mysql -u root -p ordering_system < backup.sql
```

## Support

If you encounter any issues:
1. Check that XAMPP MySQL is running
2. Verify the database credentials
3. Check the PHP error logs
4. Ensure all files are in the correct directories
