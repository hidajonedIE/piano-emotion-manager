
import mysql.connector
import os
from datetime import datetime, timedelta

def seed_data():
    try:
        # --- Conexión a la Base de Datos ---
        db_connection = mysql.connector.connect(
            host="gateway01.eu-central-1.prod.aws.tidbcloud.com",
            port=4000,
            user="2GeAqAcm5LrcHRv.root",
            password="PianoEmotion2026",
            database="piano_emotion_db",
            ssl_verify_identity=False,
            ssl_disabled=False
        )
        cursor = db_connection.cursor()
        print("Conexión a la base de datos establecida con éxito.")

        # --- Limpieza de Datos ---
        print("Limpiando datos de prueba anteriores...")
        cursor.execute("DELETE FROM services WHERE odId LIKE 'test_service_%'")
        cursor.execute("DELETE FROM pianos WHERE odId LIKE 'test_piano_%'")
        cursor.execute("DELETE FROM clients WHERE odId LIKE 'test_client_%'")
        db_connection.commit()
        print("Datos anteriores eliminados.")

        # --- Inserción de Clientes ---
        print("Insertando nuevos clientes...")
        clients = [
            ("test_client_1", "Cliente Particular", "juan.perez@email.com", "600111222", "Calle Falsa 123", "particular", 1),
            ("test_client_2", "Escuela de Música Sol", "ana.garcia@escuelasol.com", "912345678", "Avenida de la Música 45", "music_school", 1),
            ("test_client_3", "Conservatorio Mayor", "carlos.lopez@conservatoriomayor.es", "934567890", "Plaza del Arte 1", "conservatory", 1),
            ("test_client_4", "Sala de Conciertos Filarmonía", "laura.martinez@filarmonia.org", "945678901", "Paseo de la Orquesta 2", "concert_hall", 1)
        ]
        client_insert_query = "INSERT INTO clients (odId, name, email, phone, address, clientType, partnerId) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(client_insert_query, clients)
        db_connection.commit()
        print(f"{cursor.rowcount} clientes insertados.")

        # --- Inserción de Pianos ---
        print("Insertando nuevos pianos...")
        pianos = [
            (1, 'Yamaha', 'U1', '123456', 'vertical', 'test_piano_1', 1),
            (2, 'Kawai', 'K-300', '789012', 'vertical', 'test_piano_2', 1),
            (2, 'Steinway & Sons', 'Model D', '345678', 'grand', 'test_piano_3', 1),
            (3, 'Bösendorfer', '280VC', '901234', 'grand', 'test_piano_4', 1),
            (3, 'Fazioli', 'F278', '567890', 'grand', 'test_piano_5', 1),
            (4, 'Steinway & Sons', 'Model B', '112233', 'grand', 'test_piano_6', 1)
        ]
        piano_insert_query = "INSERT INTO pianos (clientId, brand, model, serialNumber, pianoType, odId, partnerId) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(piano_insert_query, pianos)
        db_connection.commit()
        print(f"{cursor.rowcount} pianos insertados.")

        # --- Inserción de Servicios ---
        print("Insertando nuevos servicios...")
        services = [
            (1, 'tuning', (datetime.now() - timedelta(days=400)).strftime("%Y-%m-%d %H:%M:%S"), 'test_service_1', 1, 1),
            (2, 'tuning', (datetime.now() - timedelta(days=100)).strftime("%Y-%m-%d %H:%M:%S"), 'test_service_2', 2, 1),
            (3, 'regulation', (datetime.now() - timedelta(days=800)).strftime("%Y-%m-%d %H:%M:%S"), 'test_service_3', 2, 1),
            (4, 'tuning', (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S"), 'test_service_4', 3, 1),
            (5, 'maintenance_premium', (datetime.now() - timedelta(days=1000)).strftime("%Y-%m-%d %H:%M:%S"), 'test_service_5', 3, 1),
            (6, 'tuning', (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d %H:%M:%S"), 'test_service_6', 4, 1)
        ]
        service_insert_query = "INSERT INTO services (pianoId, serviceType, date, odId, clientId, partnerId) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.executemany(service_insert_query, services)
        db_connection.commit()
        print(f"{cursor.rowcount} servicios insertados.")

        print("\n¡Población de datos de prueba completada con éxito!")

    except mysql.connector.Error as err:
        print(f"Error al conectar o manipular la base de datos: {err}")
    finally:
        if 'db_connection' in locals() and db_connection.is_connected():
            cursor.close()
            db_connection.close()
            print("Conexión a la base de datos cerrada.")

if __name__ == "__main__":
    seed_data()
