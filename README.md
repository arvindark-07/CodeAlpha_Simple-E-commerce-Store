# E-Commerce Web Application

A full-stack e-commerce application built with Express.js (Node.js), SQLite, HTML, CSS, and JavaScript.

## Features

✅ **User Authentication**
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt

✅ **Product Management**
- Product listings with images
- Product details page
- Categories and stock management

✅ **Shopping Cart**
- Add/remove products
- Update quantities
- Real-time cart updates
- Persistent cart (localStorage)

✅ **Order Processing**
- Complete checkout process
- Order history
- Order status tracking

✅ **Database**
- SQLite database
- Tables: users, products, orders, order_items

## Project Structure

```
ecommerce-project/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   └── ecommerce.db       # SQLite database (auto-created)
│
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styling
│   └── script.js          # JavaScript logic
│
└── README.md
```

## Installation & Setup

### 1. Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/)

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start

# OR for development with auto-restart
npm run dev
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

Simply open `index.html` in your web browser, or use a local server:

```bash
# Using Python (if installed)
cd frontend
python -m http.server 8000

# Using Node.js http-server (install globally first)
npm install -g http-server
http-server frontend -p 8000
```

Then visit `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Orders (Protected)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders

## Database Schema

### Users Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT - hashed)
- created_at (DATETIME)
```

### Products Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- price (REAL)
- stock (INTEGER)
- category (TEXT)
- image_url (TEXT)
- created_at (DATETIME)
```

### Orders Table
```sql
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER - foreign key)
- total (REAL)
- status (TEXT)
- created_at (DATETIME)
```

### Order Items Table
```sql
- id (INTEGER PRIMARY KEY)
- order_id (INTEGER - foreign key)
- product_id (INTEGER - foreign key)
- quantity (INTEGER)
- price (REAL)
```

## Usage

1. **Browse Products**: View all available products on the home page
2. **View Details**: Click on any product to see detailed information
3. **Add to Cart**: Click "Add to Cart" button to add items
4. **Register/Login**: Click the Login button to create an account or sign in
5. **Checkout**: Go to cart and click "Place Order" (requires login)
6. **View Orders**: Click "Orders" in navigation to see your order history

## Technologies Used

### Backend
- **Express.js** - Web framework
- **SQLite3** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Interactivity
- **Fetch API** - HTTP requests
- **LocalStorage** - Cart persistence

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- CORS enabled for security

## Future Enhancements

- Product search and filtering
- Payment gateway integration
- Admin dashboard
- Product reviews and ratings
- Email notifications
- Image upload functionality
- Wishlist feature
- Multi-language support

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in server.js or kill the process using the port
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:5000 | xargs kill
```

**Database errors:**
Delete `ecommerce.db` file and restart the server to recreate the database.

**CORS errors:**
Make sure the backend is running and the API_URL in `script.js` matches your backend URL.

## License

MIT License - Feel free to use this project for learning and development.

## Author

Created for CodeAlpha Internship

## Support

For issues and questions, please create an issue in the repository.
