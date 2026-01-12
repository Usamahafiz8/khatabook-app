import { enablePromise, openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Alert } from 'react-native';
import Share from 'react-native-share';
import moment from 'moment';

const login = 'user';
const people = 'people';
const transactions = 'transactions';

enablePromise(true);

export const getDBConnection = async () => {
    const databaseName = 'khata.db'
    // let databasePath = `${RNFS.DocumentDirectoryPath}/${databaseName}`
    // let databasePath = `/storage/emulated/0/Documents/${databaseName}`

    return openDatabase({ name: databaseName, location: 'Shared' });
};



export const createUserTable = async (db: SQLiteDatabase) => {
    // Create table if it doesn't exist
    const query = `CREATE TABLE IF NOT EXISTS ${login}(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
        );`;
    await db.executeSql(query);
};

export const addUser = async (db: SQLiteDatabase, email: string, password: string) => {
    // Insert a new user
    const query = `INSERT INTO ${login} (email, password) VALUES (?, ?);`;
    const data = await db.executeSql(query, [email, password]);
    return data
};

export const getUser = async (
    db: SQLiteDatabase,
    email: string,
    password: string
) => {
    const query = `SELECT id FROM user WHERE email = ? AND password = ?;`; // Use hashed password for comparison
    const results = await db.executeSql(query, [email, password]);

    if (results[0].rows.length > 0) {
        return results[0].rows.item(0).id; // Return user ID
    } else {
        throw new Error('Invalid email or password');
    }
};

export const getUserById = async (
    db: SQLiteDatabase,
    id: string
) => {
    const query = `SELECT email FROM user WHERE id = ?;`; // Use hashed password for comparison
    const results = await db.executeSql(query, [id]);

    if (results[0].rows.length > 0) {
        return results[0].rows.item(0).email; // Return user ID
    } else {
        throw new Error('Invalid email or password');
    }
};


export const deleteUser = async (db: SQLiteDatabase, id: number) => {
    // Delete a user by id
    const query = `DELETE FROM ${login} WHERE id = ?;`;
    await db.executeSql(query, [id]);
};

export const createCustomerTable = async (db: SQLiteDatabase) => {
    const peopleTable = `
            CREATE TABLE IF NOT EXISTS ${people} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL, -- Foreign key referencing users.id
                name TEXT NOT NULL,
                mobile_number TEXT NULL,
                type TEXT NOT NULL CHECK(type IN ('customer', 'supplier')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        `;
    await db.executeSql(peopleTable);
};

export const createTransactionTable = async (db: SQLiteDatabase) => {
    const transactionsTable = `
        CREATE TABLE IF NOT EXISTS ${transactions} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL, -- Foreign key referencing people.id
        amount REAL NOT NULL, -- Positive for credit, negative for debit
        description TEXT,
        balance REAL NULL,
        payment_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        transaction_date TEXT NOT NULL, -- Format: 12/9/2024
        transaction_time TEXT NOT NULL, -- Format: 6:52:00 PM
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
    );
    `;
    await db.executeSql(transactionsTable);
}

export const addPerson = async (
    db: SQLiteDatabase,
    user_id: number,
    name: string,
    type: 'customer' | 'supplier',
    mobile_number?: string
) => {
    console.log(`${user_id} ${name} ${type} ${mobile_number} `)
    const query = `INSERT INTO people (user_id, name, mobile_number, type) VALUES (?, ?, ?, ?);`;
    const results = await db.executeSql(query, [user_id, name, mobile_number || null, type]);
    if (results[0].insertId) {
        return results[0].insertId; // Return customer ID
    } else {
        throw new Error('Error while saving customer');
    }
};

export const deletePerson = async (
    db: SQLiteDatabase,
    person_id: number
) => {
    try {
        // Start a transaction
        await db.executeSql('BEGIN TRANSACTION');

        // Delete all transactions associated with the person
        const deleteTransactionsQuery = `DELETE FROM ${transactions} WHERE person_id = ?;`;
        await db.executeSql(deleteTransactionsQuery, [person_id]);

        // Delete the person
        const deletePersonQuery = `DELETE FROM ${people} WHERE id = ?;`;
        await db.executeSql(deletePersonQuery, [person_id]);

        // Commit the transaction
        await db.executeSql('COMMIT');

        console.log(`Person with ID ${person_id} and their transactions deleted successfully`);
    } catch (error: any) {
        // Rollback the transaction in case of any error
        await db.executeSql('ROLLBACK');
        console.error(`Error deleting person: ${error.message}`);
        throw new Error(`Error deleting person: ${error.message}`);
    }
};

export const updatePerson = async (
    db: SQLiteDatabase,
    person_id: number,
    user_id: number,
    name: string,
    mobile_number?: string
) => {
    console.log(`Updating Person: ${person_id}, ${user_id}, ${name}, ${mobile_number}`);
    
    const query = `UPDATE people SET user_id = ?, name = ?, mobile_number = ? WHERE id = ?;`;
    const results = await db.executeSql(query, [user_id, name, mobile_number || null, person_id]);
    
    if (results[0].rowsAffected > 0) {
        return true; // Update successful
    } else {
        throw new Error('Error while updating person or person not found');
    }
};


export const deleteTransaction = async (
    db: SQLiteDatabase,
    transaction_id: number
) => {
    try {
        // Start a transaction
        await db.executeSql('BEGIN TRANSACTION');

        // Get the transaction details
        const getTransactionQuery = `SELECT person_id, amount, payment_type FROM ${transactions} WHERE id = ?;`;
        const [transactionResult] = await db.executeSql(getTransactionQuery, [transaction_id]);

        if (transactionResult.rows.length === 0) {
            throw new Error('Transaction not found');
        }

        const transaction = transactionResult.rows.item(0);

        // Delete the transaction
        const deleteTransactionQuery = `DELETE FROM ${transactions} WHERE id = ?;`;
        await db.executeSql(deleteTransactionQuery, [transaction_id]);

        // Update the balance for subsequent transactions
        const updateBalanceQuery = `
            UPDATE ${transactions}
            SET balance = balance ${transaction.payment_type === 'credit' ? '-' : '+'} ?
            WHERE person_id = ? AND id > ?;
        `;
        await db.executeSql(updateBalanceQuery, [transaction.amount, transaction.person_id, transaction_id]);

        // Commit the transaction
        await db.executeSql('COMMIT');

        console.log(`Transaction with ID ${transaction_id} deleted successfully and balances updated`);
    } catch (error: any) {
        // Rollback the transaction in case of any error
        await db.executeSql('ROLLBACK');
        console.error(`Error deleting transaction: ${error.message}`);
        throw new Error(`Error deleting transaction: ${error.message}`);
    }
};

export const getPeopleList = async (
    db: SQLiteDatabase,
    user_id: string,
    type: 'customer' | 'supplier'
) => {
    const query = `
        SELECT 
            p.id, 
            p.name, 
            p.mobile_number,
            COALESCE(SUM(CASE 
                WHEN t.payment_type = 'credit' THEN t.amount 
                WHEN t.payment_type = 'debit' THEN -t.amount 
                ELSE 0 END), 0) AS balance,
            MAX(t.transaction_time) AS latest_transaction_date
        FROM people p
        LEFT JOIN transactions t ON p.id = t.person_id
        WHERE p.user_id = ? AND p.type = ?
        GROUP BY p.id, p.name, p.mobile_number
        ORDER BY latest_transaction_date DESC NULLS LAST, p.name ASC;
    `;

    const results = await db.executeSql(query, [user_id, type]);

    const peopleList: {
        id: number;
        name: string;
        mobile_number: string | null;
        balance: number; // Added balance field
    }[] = [];

    results.forEach(result => {
        for (let i = 0; i < result.rows.length; i++) {
            peopleList.push(result.rows.item(i));
        }
    });

    return peopleList;
};

// const formatMMDDYYYY = (date: string) => {
//     const [month, day, year]:any = date.split('/');  // Split MM/DD/YYYY
//     const formattedMonth = month.padStart(2, '0');  // Add leading zero if necessary
//     const formattedDay = day.padStart(2, '0');  // Add leading zero if necessary
//     return `${year}-${formattedMonth}-${formattedDay}`;  // Return as YYYYMMDD
// };

export const addTransaction = async (
    db: SQLiteDatabase,
    person_id: number,
    amount: number,
    description: string,
    transaction_date: string, // e.g., "2/18/2025"
    transaction_time: string, // e.g., "10:02:10 PM"
    payment_type: string
) => {
    try {
        console.log("Raw Transaction Date:", transaction_date);
        console.log("Raw Transaction Time:", transaction_time);

        // Format date and time to standard format - try multiple formats for robustness
        const parsedDate = moment(transaction_date, ["M/D/YYYY", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], true);
        if (!parsedDate.isValid()) {
            throw new Error(`Invalid date format: ${transaction_date}`);
        }
        const formattedDate = parsedDate.format("YYYY-MM-DD");
        
        const parsedTime = moment(transaction_time, ["h:mm:ss A", "hh:mm:ss A", "HH:mm:ss"], true);
        if (!parsedTime.isValid()) {
            throw new Error(`Invalid time format: ${transaction_time}`);
        }
        const formattedTime = parsedTime.format("HH:mm:ss");

        console.log("Formatted Transaction Date:", formattedDate);
        console.log("Formatted Transaction Time:", formattedTime);

        // Start a transaction
        await db.executeSql("BEGIN TRANSACTION");

        // Insert the new transaction
        const insertQuery = `
            INSERT INTO transactions (
                person_id, amount, description, transaction_date, transaction_time, payment_type
            ) VALUES (?, ?, ?, ?, ?, ?);
        `;
        const insertResults = await db.executeSql(insertQuery, [
            person_id, amount, description, formattedDate, formattedTime, payment_type
        ]);

        if (!insertResults[0].insertId) {
            throw new Error("Error inserting transaction: No insert ID returned");
        }

        // Fetch all transactions for the person, ordered by date and time
        const fetchQuery = `
            SELECT id, amount, payment_type, transaction_date, transaction_time
            FROM transactions
            WHERE person_id = ?
            ORDER BY transaction_date, transaction_time;
        `;
        const fetchResults = await db.executeSql(fetchQuery, [person_id]);

        // Recalculate balance from the first transaction onwards
        let runningBalance = 0;
        const updatePromises = [];

        for (let i = 0; i < fetchResults[0].rows.length; i++) {
            const transaction = fetchResults[0].rows.item(i);
            runningBalance += transaction.payment_type === "credit" ? transaction.amount : -transaction.amount;

            const updateQuery = `
                UPDATE transactions
                SET balance = ?
                WHERE id = ?;
            `;
            updatePromises.push(db.executeSql(updateQuery, [runningBalance, transaction.id]));
        }

        // Execute all balance update queries
        await Promise.all(updatePromises);

        // Commit the transaction
        await db.executeSql("COMMIT");

        return insertResults[0].insertId; // Return transaction ID
    } catch (error: any) {
        // Rollback the transaction in case of any error
        await db.executeSql("ROLLBACK");
        throw new Error(`Error while adding transaction: ${error.message}`);
    }
};


export const updateTransaction = async (
    db: SQLiteDatabase,
    transaction_id: number,
    person_id: number,
    newAmount: number,
    newDescription: string
) => {
    try {
        // Start a transaction
        await db.executeSql('BEGIN TRANSACTION');

        // Update the transaction with the new details
        const updateQuery = `
            UPDATE transactions
            SET amount = ?, description = ? WHERE id = ?;
        `;
        await db.executeSql(updateQuery, [
            newAmount,
            newDescription,
            transaction_id
        ]);

        // Fetch all transactions for the person, ordered by date and time
        const fetchQuery = `
            SELECT id, amount, payment_type, transaction_date, transaction_time
            FROM transactions
            WHERE person_id = ?
            ORDER BY transaction_date, transaction_time;
        `;
        const fetchResults = await db.executeSql(fetchQuery, [person_id]);

        // Recalculate balance for all transactions
        let runningBalance = 0;
        const updatePromises = [];

        for (let i = 0; i < fetchResults[0].rows.length; i++) {
            const transaction = fetchResults[0].rows.item(i);
            runningBalance += transaction.payment_type === 'credit' ? transaction.amount : -transaction.amount;

            const balanceUpdateQuery = `
                UPDATE transactions
                SET balance = ?
                WHERE id = ?;
            `;
            updatePromises.push(db.executeSql(balanceUpdateQuery, [runningBalance, transaction.id]));
        }

        // Execute all balance update queries
        await Promise.all(updatePromises);

        // Commit the transaction
        await db.executeSql('COMMIT');

        return true; // Indicate successful update
    } catch (error: any) {
        // Rollback the transaction in case of any error
        await db.executeSql('ROLLBACK');
        throw new Error(`Error while updating transaction: ${error.message}`);
    }
};

export const getTransactionsAndBalance = async (
    db: SQLiteDatabase,
    person_id: number,
    startDate: string, // e.g., "1/1/2001"
    endDate: string // e.g., "2/18/2025"
) => {
    console.log("Raw Start Date:", startDate);
    console.log("Raw End Date:", endDate);
    console.log("User ID:", person_id);

    // Format startDate and endDate to "YYYY-MM-DD" - try multiple formats for robustness
    const parsedStartDate = moment(startDate, ["M/D/YYYY", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], true);
    const parsedEndDate = moment(endDate, ["M/D/YYYY", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], true);
    
    const formattedStartDate = parsedStartDate.isValid() ? parsedStartDate.format("YYYY-MM-DD") : "2001-01-01";
    const formattedEndDate = parsedEndDate.isValid() ? parsedEndDate.format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");

    console.log("Formatted Start Date:", formattedStartDate);
    console.log("Formatted End Date:", formattedEndDate);

    const query = `
        SELECT 
            id, 
            amount, 
            description, 
            transaction_date, 
            transaction_time, 
            payment_type,
            balance
        FROM transactions
        WHERE person_id = ? 
            AND transaction_date BETWEEN ? AND ?
        ORDER BY transaction_date DESC, transaction_time DESC;
    `;

    const results = await db.executeSql(query, [person_id, formattedStartDate, formattedEndDate]);

    const transactions: {
        id: number;
        amount: number;
        description: string;
        transaction_date: string;
        transaction_time: string;
        payment_type: 'credit' | 'debit';
        balance: number;
    }[] = [];

    let totalBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    results.forEach(result => {
        for (let i = 0; i < result.rows.length; i++) {
            const transaction = result.rows.item(i);

            // Convert transaction_date and transaction_time to formatted strings
            transaction.transaction_date = moment(transaction.transaction_date, "YYYY-MM-DD").format("YYYY-MM-DD");
            transaction.transaction_time = moment(transaction.transaction_time, "HH:mm:ss").format("HH:mm:ss");

            transactions.push(transaction);

            // Adjust balance and calculate totals based on payment_type
            if (transaction.payment_type === "credit") {
                totalBalance += transaction.amount;
                totalCredit += transaction.amount;
            } else if (transaction.payment_type === "debit") {
                totalBalance -= transaction.amount;
                totalDebit += transaction.amount;
            }
        }
    });

    return { transactions, totalBalance, totalCredit, totalDebit };
};

export const getCustomerCreditsAndDebits = async (
    db: SQLiteDatabase,
    user_id: number
) => {
    const query = `
        SELECT 
            COALESCE(SUM(CASE WHEN t.payment_type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
            COALESCE(SUM(CASE WHEN t.payment_type = 'debit' THEN t.amount ELSE 0 END), 0) AS total_debit,
            (COALESCE(SUM(CASE WHEN t.payment_type = 'debit' THEN t.amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN t.payment_type = 'credit' THEN t.amount ELSE 0 END), 0)) AS remaining_debit
        FROM people p
        LEFT JOIN transactions t ON p.id = t.person_id
        WHERE p.user_id = ? AND p.type = 'customer';
    `;

    const results = await db.executeSql(query, [user_id]);

    if (results[0].rows.length > 0) {
        return results[0].rows.item(0); // Returns an object with total_credit, total_debit, and remaining_debit
    } else {
        return { total_credit: 0, total_debit: 0, remaining_debit: 0 }; // Default to zero if no data exists
    }
};


export const getSupplierCreditsAndDebits = async (
    db: SQLiteDatabase,
    user_id: number
) => {
    const query = `
        SELECT 
            COALESCE(SUM(CASE WHEN t.payment_type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
            COALESCE(SUM(CASE WHEN t.payment_type = 'debit' THEN t.amount ELSE 0 END), 0) AS total_debit,
            (COALESCE(SUM(CASE WHEN t.payment_type = 'debit' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.payment_type = 'credit' THEN t.amount ELSE 0 END), 0)) AS remaining_debit
        FROM people p
        LEFT JOIN transactions t ON p.id = t.person_id
        WHERE p.user_id = ? AND p.type = 'supplier';
    `;

    const results = await db.executeSql(query, [user_id]);

    if (results[0].rows.length > 0) {
        return results[0].rows.item(0); // Returns an object with total_credit, total_debit, and remaining_credit
    } else {
        return { total_credit: 0, total_debit: 0, remaining_credit: 0 }; // Default to zero if no data exists
    }
};


interface KhataItem {
    person_id: number;
    person_name: string;
    customer_type: 'customer' | 'supplier';
    total_credit: number;
    desp: string;
    date: string;
    total_debit: number;
    balance: number;
    status: 'credit' | 'debit';
}

interface KhataBalanceSheet {
    khataList: KhataItem[];
    totalReceived: { customer: number, supplier: number }; // Total money received
    totalSpent: { customer: number, supplier: number }; // Total money spent
    netBalance: number
}

const formatToMMDDYYYY = (date: string) => {
    const [month, day, year]: any = date.split('/');  // Split MM/DD/YYYY
    // const formattedMonth = month.padStart(2, '0');  // Add leading zero if necessary
    // const formattedDay = day.padStart(2, '0');  // Add leading zero if necessary
    // return `${formattedMonth}/${formattedDay}/${year}`;  // Return as YYYYMMDD
    const dateObject = new Date(year, month - 1, day);
    return dateObject
};

export const getKhataBalanceSheet = async (
    db: SQLiteDatabase,
    user_id: number,
    start_date: string,
    end_date: string
): Promise<KhataBalanceSheet> => {
    const query = `
        SELECT 
            p.id AS person_id,
            p.name AS person_name,
            p.type AS customer_type,
            t.description AS desp, 
            t.transaction_date AS date, 
            t.balance AS balance,
            COALESCE(SUM(CASE WHEN t.payment_type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
            COALESCE(SUM(CASE WHEN t.payment_type = 'debit' THEN t.amount ELSE 0 END), 0) AS total_debit
        FROM people p
        LEFT JOIN transactions t 
            ON p.id = t.person_id 
        WHERE p.user_id = ?
        GROUP BY p.id, p.name, p.type
        ORDER BY p.name ASC;
    `;

    // // Convert to proper date format for comparison
    // const fsd = formatToMMDDYYYY(start_date);
    // const fed = formatToMMDDYYYY(end_date);

    const results = await db.executeSql(query, [user_id]);

    const khataList: KhataItem[] = [];
    let totalSpent = { customer: 0, supplier: 0 }; // Debit
    let totalReceived = { customer: 0, supplier: 0 }; // Credit

    results.forEach(result => {
        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);

            // Parse the date properly
            const transactionDate = formatToMMDDYYYY(row.date);  // Assuming row.date is in YYYY-MM-DD format
            // console.log(transactionDate.getTime())
            // console.log(fsd.getTime())
            // console.log(fed.getTime())
            // If the transaction date is within the range
            // if (transactionDate.getTime() >= fsd.getTime() && transactionDate.getTime() <= fed.getTime()) {
            const balance = row.total_credit - row.total_debit;
            const status = balance >= 0 ? 'credit' : 'debit';

            // Update totals based on customer type
            if (row.customer_type === 'customer') {
                totalReceived.customer += row.total_credit;
                totalSpent.customer += row.total_debit;
            } else if (row.customer_type === 'supplier') {
                totalReceived.supplier += row.total_credit;
                totalSpent.supplier += row.total_debit;
            }

            const khataItem: KhataItem = {
                person_id: row.person_id,
                person_name: row.person_name,
                customer_type: row.customer_type,
                total_credit: row.total_credit,
                desp: row.desp,
                date: row.date,
                total_debit: row.total_debit,
                balance: row.balance,
                status: status
            };

            khataList.push(khataItem);
            // }
        }
    });

    const netBalance = (totalReceived.customer - totalSpent.customer) + (totalReceived.supplier - totalSpent.supplier);

    return {
        khataList,
        totalReceived,
        totalSpent,
        netBalance
    };
};

// Function to export the database
export const exportDatabase = async (db: SQLiteDatabase) => {
    try {
        const tables = ['user', 'people', 'transactions'];
        let exportData: { [key: string]: any[] } = {};

        for (let table of tables) {
            const [results] = await db.executeSql(`SELECT * FROM ${table}`);
            exportData[table] = [];
            for (let i = 0; i < results.rows.length; i++) {
                exportData[table].push(results.rows.item(i));
            }
        }

        const jsonData = JSON.stringify(exportData);
        const path = `${RNFS.ExternalStorageDirectoryPath}/Documents/khata_export.json`;
        await RNFS.writeFile(path, jsonData, 'utf8');

        // Share the exported file
        const shareOptions = {
            title: 'Exported Database',
            url: `file://${path}`,
            type: 'application/json',
        };
        await Share.open(shareOptions);

        console.log('Database exported successfully to:', path);
        return path;
    } catch (error) {
        console.error('Error exporting database:', error);
        // throw error;
    }
};

const TABLES = {
    user: 'user',
    people: 'people',
    transactions: 'transactions',
};


const createPeopleTable = async (db: SQLiteDatabase) => {
    const query = `CREATE TABLE IF NOT EXISTS ${TABLES.people} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      mobile_number TEXT,
      type TEXT NOT NULL CHECK(type IN ('customer', 'supplier')),
      FOREIGN KEY (user_id) REFERENCES ${TABLES.user} (id) ON DELETE CASCADE
    );`;
    await db.executeSql(query);
};

export const initializeDatabase = async (): Promise<SQLiteDatabase> => {
    try {
        const db = await getDBConnection();
        console.log('Database connection established');

        await createUserTable(db);
        console.log('User table created or already exists');

        await createPeopleTable(db);
        console.log('People table created or already exists');

        await createTransactionTable(db);
        console.log('Transaction table created or already exists');

        return db;
    } catch (error: any) {
        console.error('Error initializing database:', error);
        throw new Error(`Failed to initialize database: ${error.message}`);
    }
};

export const importDatabase = async (filePath: string): Promise<void> => {
    let db: SQLiteDatabase | null = null;
    try {
        db = await initializeDatabase();
        console.log('Database initialized for import');

        const jsonData = await RNFS.readFile(filePath, 'utf8');
        const importData = JSON.parse(jsonData);

        console.log('Importing data:', JSON.stringify(importData, null, 2));

        await db.transaction((tx) => {
            for (const table in importData) {
                if (Object.prototype.hasOwnProperty.call(importData, table)) {
                    const rows = importData[table];
                    if (rows && rows.length > 0) {
                        // Clear existing data
                        tx.executeSql(`DELETE FROM ${table}`, [],
                            () => console.log(`Cleared table ${table}`),
                            (_, error) => {
                                console.error(`Error clearing table ${table}:`, error);
                                return false; // Roll back the transaction
                            }
                        );

                        // Insert new data
                        const columns = Object.keys(rows[0]).join(', ');
                        const placeholders = new Array(Object.keys(rows[0]).length).fill('?').join(', ');
                        const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

                        for (const row of rows) {
                            const values = Object.values(row);
                            tx.executeSql(query, values,
                                () => console.log(`Inserted row into ${table}`),
                                (_, error) => {
                                    console.error(`Error inserting into ${table}:`, error);
                                    return false; // Roll back the transaction
                                }
                            );
                        }
                    } else {
                        console.warn(`No data to import for table ${table}`);
                    }
                }
            }
        });

        console.log('Database imported successfully');
        Alert.alert('Success', 'Database imported successfully');
    } catch (error: any) {
        console.error('Error importing database:', error);
        Alert.alert('Error', `Failed to import database: ${error.message}`);
        // throw error;
    } finally {
        if (db) {
            await db.close();
            console.log('Database connection closed');
        }
    }
};
