import React, {useState} from 'react'
import {View, Text, Button, Image, StyleSheet, Alert} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null)

  async function pickImage() {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('permission denied', 'need camera-roll permission to pick image')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.cancelled) {
      setImageUri(result.assets && result.assets[0]?.uri ? result.assets[0].uri : (result as any).uri)
    }
  }

  return (
    <View style={styles['upload']}> 
      <Text style={styles['upload__title']}>Upload document</Text>
      <View style={styles['upload__preview']}> 
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles['upload__image']} />
        ) : (
          <Text style={styles['upload__hint']}>No image selected</Text>
        )}
      </View>
      <View style={styles['upload__actions']}> 
        <Button title="Pick image" onPress={pickImage} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  upload: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  "upload__title": {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: '600',
  },
  "upload__preview": {
    height: 320,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  "upload__image": {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  "upload__hint": {
    color: '#9ca3af',
  },
  "upload__actions": {
    marginTop: 8,
  },
})
