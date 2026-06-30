const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding database...');
  
  // Create sample users
  const users = [
    { name: 'John Smith', email: 'john@example.com', password: 'password123', phone: '+1 555-0101', location: 'New York, NY' },
    { name: 'Sarah Johnson', email: 'sarah@example.com', password: 'password123', phone: '+1 555-0102', location: 'Los Angeles, CA' },
    { name: 'Mike Chen', email: 'mike@example.com', password: 'password123', phone: '+1 555-0103', location: 'Chicago, IL' },
    { name: 'Emily Davis', email: 'emily@example.com', password: 'password123', phone: '+1 555-0104', location: 'Houston, TX' },
    { name: 'Alex Wilson', email: 'alex@example.com', password: 'password123', phone: '+1 555-0105', location: 'Phoenix, AZ' }
  ];
  
  const userIds = [];
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, phone, location) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, hashedPassword, user.phone, user.location],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    userIds.push(result);
    console.log(`Created user: ${user.name} (ID: ${result})`);
  }
  
  // Create sample products
  const products = [
    {
      title: 'MacBook Pro 16-inch M3 Max',
      description: 'Brand new MacBook Pro 16-inch with M3 Max chip, 36GB RAM, 1TB SSD. Sealed in box, never opened. Perfect for professionals.',
      price: 3499.00,
      condition: 'new',
      category_id: 1,
      seller_id: userIds[0],
      images: JSON.stringify(['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800']),
      location: 'New York, NY'
    },
    {
      title: 'Vintage Leather Jacket',
      description: 'Genuine vintage leather jacket from the 1980s. Brown color, excellent condition. Size M.',
      price: 189.99,
      condition: 'good',
      category_id: 2,
      seller_id: userIds[1],
      images: JSON.stringify(['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800']),
      location: 'Los Angeles, CA'
    },
    {
      title: 'Modern Sofa - 3 Seater',
      description: 'Beautiful gray fabric sofa, 3 seater. Only 6 months old, moving sale. Very comfortable.',
      price: 450.00,
      condition: 'like_new',
      category_id: 3,
      seller_id: userIds[2],
      images: JSON.stringify(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800']),
      location: 'Chicago, IL'
    },
    {
      title: 'Nike Air Jordan 1 Retro',
      description: 'Air Jordan 1 Retro High OG "Chicago" - Size 10.5. Worn once, comes with original box.',
      price: 320.00,
      condition: 'like_new',
      category_id: 4,
      seller_id: userIds[3],
      images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800']),
      location: 'Houston, TX'
    },
    {
      title: 'Complete Harry Potter Book Set',
      description: 'All 7 books in hardcover, first edition prints. Good condition with minor wear on covers.',
      price: 85.00,
      condition: 'good',
      category_id: 5,
      seller_id: userIds[4],
      images: JSON.stringify(['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800']),
      location: 'Phoenix, AZ'
    },
    {
      title: 'Sony PlayStation 5 Console',
      description: 'PS5 Disc Edition with 2 controllers and 5 games included. Barely used, like new condition.',
      price: 499.99,
      condition: 'like_new',
      category_id: 6,
      seller_id: userIds[0],
      images: JSON.stringify(['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800']),
      location: 'New York, NY'
    },
    {
      title: '2019 Honda Civic - Low Mileage',
      description: '2019 Honda Civic LX, 32,000 miles, single owner, all service records. Silver color, automatic transmission.',
      price: 18500.00,
      condition: 'good',
      category_id: 7,
      seller_id: userIds[1],
      images: JSON.stringify(['https://images.unsplash.com/photo-1605816988067-b0e2f3b1f5f6?w=800']),
      location: 'Los Angeles, CA'
    },
    {
      title: 'Vintage Rolex Submariner 16610',
      description: 'Authentic Rolex Submariner reference 16610. Year 2005. Recently serviced, comes with box and papers.',
      price: 8500.00,
      condition: 'good',
      category_id: 8,
      seller_id: userIds[2],
      images: JSON.stringify(['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800']),
      location: 'Chicago, IL'
    },
    {
      title: 'Dyson Airwrap Complete',
      description: 'Dyson Airwrap Complete Styler. All attachments included. Used twice, decided to stick with my old tools.',
      price: 499.00,
      condition: 'like_new',
      category_id: 9,
      seller_id: userIds[3],
      images: JSON.stringify(['https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800']),
      location: 'Houston, TX'
    },
    {
      title: 'Mechanical Keyboard - Keychron K2',
      description: 'Keychron K2 Wireless Mechanical Keyboard with Gateron Brown switches. RGB backlight. Great for typing.',
      price: 79.99,
      condition: 'good',
      category_id: 1,
      seller_id: userIds[4],
      images: JSON.stringify(['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800']),
      location: 'Phoenix, AZ'
    },
    {
      title: 'Designer Handbag - Coach',
      description: 'Authentic Coach leather handbag. Brown with gold hardware. Gently used, excellent condition.',
      price: 150.00,
      condition: 'good',
      category_id: 2,
      seller_id: userIds[0],
      images: JSON.stringify(['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800']),
      location: 'New York, NY'
    },
    {
      title: 'Garden Tool Set - Complete',
      description: 'Complete garden tool set including shovel, rake, hoe, trowel, and gloves. All in great condition.',
      price: 45.00,
      condition: 'good',
      category_id: 3,
      seller_id: userIds[1],
      images: JSON.stringify(['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800']),
      location: 'Los Angeles, CA'
    },
    {
      title: 'Mountain Bike - Trek Marlin 7',
      description: '2022 Trek Marlin 7, size M. Hydraulic disc brakes, 1x10 drivetrain. Great for trails and commuting.',
      price: 650.00,
      condition: 'good',
      category_id: 4,
      seller_id: userIds[2],
      images: JSON.stringify(['https://images.unsplash.com/photo-1485965120184-e224f7a1d7f6?w=800']),
      location: 'Chicago, IL'
    },
    {
      title: 'First Edition "The Great Gatsby"',
      description: 'Rare first edition of F. Scott Fitzgerald\'s The Great Gatsby. 1925. Some wear but pages intact.',
      price: 1200.00,
      condition: 'fair',
      category_id: 5,
      seller_id: userIds[3],
      images: JSON.stringify(['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800']),
      location: 'Houston, TX'
    },
    {
      title: 'LEGO Star Wars Millennium Falcon',
      description: 'LEGO 75192 Ultimate Collector Series Millennium Falcon. 7541 pieces. Complete with box and instructions.',
      price: 750.00,
      condition: 'new',
      category_id: 6,
      seller_id: userIds[4],
      images: JSON.stringify(['https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800']),
      location: 'Phoenix, AZ'
    }
  ];
  
  for (const product of products) {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO products (title, description, price, condition, category_id, seller_id, images, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [product.title, product.description, product.price, product.condition, product.category_id, product.seller_id, product.images, product.location],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log(`Created product: ${product.title}`);
  }
  
  console.log('\\nSeed completed successfully!');
  console.log('\\nDemo accounts:');
  console.log('  john@example.com / password123');
  console.log('  sarah@example.com / password123');
  console.log('  mike@example.com / password123');
  console.log('  emily@example.com / password123');
  console.log('  alex@example.com / password123');
  
  db.close();
}

seed().catch(err => {
  console.error('Seed error:', err);
  db.close();
});