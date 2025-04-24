# Supabase Setup Guide for Plate Order System

This guide will walk you through setting up Supabase for the Plate Order System application.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- PostgreSQL database
- Authentication
- Real-time subscriptions
- Storage
- API auto-generation

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- A Supabase project (create one in the dashboard)

## Setup Options

There are two ways to set up the required database tables:

### Option 1: Automated Setup (Recommended)

1. Run the setup script:
   ```bash
   python scripts/setup_supabase.py
   ```

2. The script will attempt to create tables automatically, but if it fails (which is common due to permission limitations with the anon key), it will provide instructions for manual setup.

### Option 2: Manual Setup

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to the "SQL Editor" in the left sidebar
4. Create a new query
5. Copy and paste the contents of `scripts/supabase_setup.sql` into the query editor
6. Run the query to create all tables and sample data

## Database Schema

The Plate Order System uses the following tables:

### `menu_items`
- `id`: UUID (Primary Key)
- `name`: TEXT
- `description`: TEXT
- `price`: DECIMAL(10,2)
- `category`: TEXT
- `image_url`: TEXT
- `is_available`: BOOLEAN
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### `orders`
- `id`: UUID (Primary Key)
- `table_id`: TEXT
- `seat_number`: INTEGER
- `items`: JSONB
- `status`: TEXT
- `notes`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `completed_at`: TIMESTAMP

### `tables`
- `id`: UUID (Primary Key)
- `name`: TEXT
- `capacity`: INTEGER
- `x_position`: FLOAT
- `y_position`: FLOAT
- `width`: FLOAT
- `height`: FLOAT
- `shape`: TEXT
- `status`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### `seats`
- `id`: UUID (Primary Key)
- `table_id`: UUID (Foreign Key to tables.id)
- `seat_number`: INTEGER
- `x_position`: FLOAT
- `y_position`: FLOAT
- `status`: TEXT
- `created_at`: TIMESTAMP

## Row Level Security (RLS)

The setup script configures Row Level Security for the tables:

- Allows read access to all users
- Allows write access only to authenticated users

## Environment Variables

Make sure your `.env` file contains the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are used by the application to connect to your Supabase project.

## Testing Your Setup

After setup, you can test your tables with:

```bash
python scripts/test_db.py
```

This will check if the tables exist and contain data.

## Troubleshooting

### Common Issues

1. **"relation does not exist" errors**: This means the tables haven't been created. Follow the manual setup instructions.

2. **Permission denied errors**: Check that your RLS policies are set up correctly.

3. **Can't create tables via API**: This is normal - the anon key doesn't have permission to create tables. Use the SQL Editor in the Supabase dashboard.

4. **Authentication issues**: Make sure your environment variables are set correctly.

### Getting Help

If you encounter issues, check the [Supabase documentation](https://supabase.com/docs) or ask for assistance in the project repository.

## Further Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase JavaScript Client](https://github.com/supabase/supabase-js)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py) 