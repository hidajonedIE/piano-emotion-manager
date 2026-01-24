-- Tabla para cachear predicciones de IA
CREATE TABLE IF NOT EXISTS ai_predictions_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id VARCHAR(255) NOT NULL,
  prediction_type ENUM('revenue', 'churn', 'maintenance') NOT NULL,
  target_month VARCHAR(7) NOT NULL COMMENT 'Formato: YYYY-MM',
  prediction_data JSON NOT NULL COMMENT 'JSON con la predicción completa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_lookup (partner_id, prediction_type, target_month),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
