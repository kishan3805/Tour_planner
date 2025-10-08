import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.0)',
    },
    loginContainer: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        marginBottom: 20
    },
    label: {
        fontSize: 15,
        position: 'relative',
        top: 10,
        backgroundColor: '#FFF',
        zIndex: 10,
        right: 90,
        textAlign: 'left',
        width: 100,
        paddingLeft: 8,
    },
    label1: {
        fontSize: 18,
        position: 'relative',
        top: 12,
        zIndex: 10,
        right: 55,
        textAlign: 'left',
        width: 150,
    },
    input: {
        width: '85%',
        padding: 10,
        borderWidth: 1,
        marginBottom: 10,
        borderRadius: 8
    },
    button: {
        backgroundColor: 'blue',
        padding: 10,
        width: '85%',
        borderRadius: 5,
        marginTop: 30,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center'
    },
    switchText: {
        fontSize: 16,
        marginVertical: 10,
        color: '#4d79ff',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 35,
        width: '90%'
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#000',
    },
    orText: {
        marginHorizontal: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    googleButton: {
        backgroundColor: '#DB4437',
        padding: 10,
        width: '85%',
        borderRadius: 5,
    },
    googleButtonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center'
    },    
});

export default styles;
