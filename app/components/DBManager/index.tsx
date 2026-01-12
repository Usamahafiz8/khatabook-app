import React from 'react';
import { View, Button, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import DocumentPicker, { DocumentPickerResponse }from 'react-native-document-picker';
import { exportDatabase, getDBConnection, importDatabase } from '../../services';

const DatabaseManager: React.FC = () => {
    const handleExport = async () => {
        try {
            const db = await getDBConnection();
            const exportPath = await exportDatabase(db);
            Alert.alert('Success', `Database exported to ${exportPath}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to export database');
        }
    };

    const handleImport = async () => {
        try {
            const db = await getDBConnection();
    
            const result: DocumentPickerResponse = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.json],
                presentationStyle: 'fullScreen',
                copyTo: 'cachesDirectory',
            });
    
            if (!result.fileCopyUri) {
                throw new Error('No file URI provided');
            }
    
            console.log('Picked file:', result.fileCopyUri);
    
            const fileUri = decodeURIComponent(result.fileCopyUri);
            console.log('Decoded URI:', fileUri);
    
            let resolvedPath = fileUri;
            if (fileUri.startsWith('file://')) {
                resolvedPath = fileUri.slice(7); // Remove 'file://' prefix
            }
    
            console.log('Resolved Path:', resolvedPath);
    
            const exists = await RNFS.exists(resolvedPath);
            if (!exists) {
                throw new Error('Import file not found');
            }
    
            importDatabase(resolvedPath);
            // Alert.alert('Success', 'Database imported successfully');
        } catch (error:any) {
            if (DocumentPicker.isCancel(error)) {
                console.log('User cancelled file picker');
            } else {
                console.error('Import error:', error);
                Alert.alert('Error', `Failed to import database: ${error?.message || ""}`);
            }
        }
    };

    return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', gap:50}}>
            <Button title="Export Database" onPress={handleExport} />
            <Button title="Import Database" onPress={handleImport} />
        </View>
    );
};

export default DatabaseManager;