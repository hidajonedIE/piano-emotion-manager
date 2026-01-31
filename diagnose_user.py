import os
import mysql.connector
from urllib.parse import urlparse

def diagnose():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        # Parse database URL
        # mysql://user:pass@host:port/db
        parsed = urlparse(db_url)
        
        conn = mysql.connector.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/'),
            ssl_disabled=False
        )
        
        cursor = conn.cursor(dictionary=True)
        
        # Check user jnavarrete@inboundemotion.com
        email = 'jnavarrete@inboundemotion.com'
        print(f"Checking user: {email}")
        
        cursor.execute("SELECT id, openId, email, subscriptionPlan, subscriptionStatus FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if user:
            print("User found:")
            for key, value in user.items():
                print(f"  {key}: {value}")
        else:
            print("User not found by email")
            
        # Check by Clerk ID mentioned in context
        clerk_id = 'user_37Nq41VhiCgFUQldUPyH8fn25j6'
        print(f"\nChecking user by Clerk ID: {clerk_id}")
        cursor.execute("SELECT id, openId, email, subscriptionPlan, subscriptionStatus FROM users WHERE openId = %s", (clerk_id,))
        user_by_id = cursor.fetchone()
        
        if user_by_id:
            print("User found by Clerk ID:")
            for key, value in user_by_id.items():
                print(f"  {key}: {value}")
        else:
            print("User not found by Clerk ID")

        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diagnose()
