DDL usado na criação do rds
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    wallet_key VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Cryptocurrencies (
    crypto_id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE Orders (
    order_id BIGINT PRIMARY KEY,
    user_id INT NOT NULL,
    crypto_id INT NOT NULL,
    order_type VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    price DECIMAL(18, 8),
    status VARCHAR(50) NOT NULL,
    amount_fee DECIMAL(18, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (crypto_id) REFERENCES Cryptocurrencies(crypto_id)
);
'
CREATE TABLE Trades (
    trade_id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    linked_order_id BIGINT,
    profit_loss DECIMAL(18, 8),
    fee_amount DECIMAL(18, 8),
    success BOOLEAN,
    percent_gain DECIMAL(5, 2),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (linked_order_id) REFERENCES Orders(order_id)
);

CREATE TABLE Balances (
    balance_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(18, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);