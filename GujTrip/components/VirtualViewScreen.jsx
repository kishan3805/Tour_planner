import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { ref, get, child } from "firebase/database";
import { database } from "./firebase";
import { WebView } from "react-native-webview";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const VirtualViewScreen = () => {
    const [allViews, setAllViews] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [filteredViews, setFilteredViews] = useState([]);
    const [placeViews, setPlaceViews] = useState([]); // ✅ views for the selected place only
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch all virtual views from Firebase
    useEffect(() => {
        const fetchViews = async () => {
            try {
                setLoading(true);
                const snapshot = await get(child(ref(database), "virtualViews"));
                if (snapshot.exists()) {
                    const data = Object.values(snapshot.val());
                    setAllViews(data);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching views:", error);
                setLoading(false);
            }
        };
        fetchViews();
    }, []);

    // Handle search input
    const handleSearch = (text) => {
        setSearchText(text);

        if (text.trim() === "") {
            setFilteredViews([]);
            return;
        }

        const results = allViews.filter(
            (view) =>
                view.placeName.toLowerCase().includes(text.toLowerCase()) ||
                view.viewName.toLowerCase().includes(text.toLowerCase())
        );

        setFilteredViews(results.slice(0, 5));
    };

    // Handle selecting a virtual view
    const handleSelectView = (view) => {
        const samePlaceViews = allViews.filter(
            (item) => item.placeName === view.placeName
        );

        const index = samePlaceViews.findIndex(
            (item) =>
                item.placeName === view.placeName &&
                item.viewName === view.viewName
        );

        setPlaceViews(samePlaceViews); // ✅ store views for same place
        setSelectedIndex(index);
        setSearchText(`${view.placeName} - ${view.viewName}`);
        setFilteredViews([]);
    };

    // Go to previous view (same place only)
    const handlePrevious = () => {
        if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
        }
    };

    // Go to next view (same place only)
    const handleNext = () => {
        if (selectedIndex < placeViews.length - 1) {
            setSelectedIndex(selectedIndex + 1);
        }
    };

    const selectedView =
        selectedIndex !== null && placeViews.length > 0
            ? placeViews[selectedIndex]
            : null;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Virtual View</Text>

            {/* Search Box */}
            <View style={styles.searchBox}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search place or view..."
                    placeholderTextColor="#888"
                    value={searchText}
                    onChangeText={handleSearch}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            setSearchText("");
                            setFilteredViews([]);
                            setSelectedIndex(null);
                            setPlaceViews([]);
                        }}
                        style={styles.clearButton}
                    >
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Suggestions */}
            {filteredViews.length > 0 && (
                <View style={styles.suggestionsBox}>
                    <FlatList
                        data={filteredViews}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.suggestionItem}
                                onPress={() => handleSelectView(item)}
                            >
                                <Text style={styles.suggestionText}>
                                    {item.placeName} - {item.viewName}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}


            <Text style={styles.title}>
                {searchText.includes('-') ? searchText.split('-')[0].trim() : searchText}
            </Text>


            {/* WebView Section */}
            <View style={styles.webviewContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF5A5F" />
                ) : selectedView && selectedView.embedLink ? (
                    <WebView
                        originWhitelist={["*"]}
                        javaScriptEnabled
                        domStorageEnabled
                        source={{
                            html: `
                                <html>
                                    <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                                        <style>
                                            body, html {
                                                margin: 0;
                                                padding: 0;
                                                height: 100%;
                                                overflow: hidden;
                                            }
                                            iframe {
                                                width: 100%;
                                                height: 100%;
                                                border: none;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        ${selectedView.embedLink}
                                    </body>
                                </html>
                            `,
                        }}
                        style={styles.webview}
                    />
                ) : (
                    <Text style={styles.noViewText}>Select a virtual view to display</Text>
                )}
            </View>

            {/* Previous & Next Buttons */}
            {selectedView && (
                <View style={styles.bottomButtons}>
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            selectedIndex === 0 && styles.disabledButton,
                        ]}
                        onPress={handlePrevious}
                        disabled={selectedIndex === 0}
                    >
                        <Text style={styles.navButtonText}>Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            selectedIndex === placeViews.length - 1 &&
                            styles.disabledButton,
                        ]}
                        onPress={handleNext}
                        disabled={selectedIndex === placeViews.length - 1}
                    >
                        <Text style={styles.navButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default VirtualViewScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
        padding: 16,
    },
    header: {
        textAlign: "center",
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12,
        marginTop: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginTop: 10,
        marginBottom: 10,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 0,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#222",
    },
    clearButton: {
        paddingHorizontal: 8,
        justifyContent: "center",
    },
    clearText: {
        fontSize: 18,
        color: "#999",
    },
    suggestionsBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        marginBottom: 12,
        maxHeight: 220,
    },
    suggestionItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f2f2f2",
    },
    suggestionText: {
        fontSize: 16,
        color: "#333",
    },
    webviewContainer: {
        flex: 1,
        width: screenWidth,
        marginTop: 10,
        overflow: "hidden",
    },
    webview: {
        flex: 1,
        width: "90%",
        borderRadius: 10,
    },
    noViewText: {
        textAlign: "center",
        fontSize: 16,
        color: "#888",
        marginTop: 20,
    },
    bottomButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    navButton: {
        flex: 1,
        marginHorizontal: 5,
        backgroundColor: "#FF5A5F",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        elevation: 3,
    },
    navButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
});
