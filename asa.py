import sqlite3

conn = sqlite3.connect(':memory:', check_same_thread=False)

def execute_query(query, params=None):
    cursor = conn.cursor()
    cursor.execute(query, params) if params else cursor.execute(query)
    result = cursor.fetchall()
    return result

def search_logs(filters):
    base_query = 'SELECT * FROM logs WHERE 1=1'
    params = []
    
    for key, value in filters.items():
        base_query += f' AND {key} = ?'
        params.append(value)
    
    return execute_query(base_query, tuple(params))

if __name__ == '__main__':
    while True:
        print("\nSample Queries:")
        print("1. Find all logs with level set to 'error'")
        print("2. Search for logs with the message containing the term 'Failed to connect'")
        print("3. Retrieve all logs related to resourceId 'server-1234'")
        print("4. Exit")

        choice = input("\nEnter query number: ")

        if choice == '1':
            result = search_logs({'level': 'error'})
        elif choice == '2':
            term = input("Enter search term: ")
            result = search_logs({'message': f'%{term}%'})
        elif choice == '3':
            resourceId = input("Enter resourceId: ")
            result = search_logs({'resourceId': resourceId})
        elif choice == '4':
            break
        else:
            print("Invalid choice. Please enter a valid query number.")
            continue

        print("\nSearch Results:")
        for log in result:
            print(log)
