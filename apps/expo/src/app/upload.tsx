import React, {useState} from 'react'
import {View, Text, Button, Image, StyleSheet, Alert} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {trpc} from '~/utils/api'

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const {mutate, isPending, error} = useMutation(
    trpc.documents.upload.mutationOptions({
      async onSuccess() {
        await queryClient.invalidateQueries(trpc.documents.list.queryFilter())
      },
    }),
  )

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

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets?.[0]
      if (!asset) return
      setImageUri(asset.uri)

      const uriParts = asset.uri.split('/')
      const fallbackName = uriParts[uriParts.length - 1] ?? `upload-${Date.now()}.jpg`
      const fileName = (asset as any).fileName ?? fallbackName
      const mimeType = (asset as any).type ?? (asset as any).mimeType ?? 'image/jpeg'
      const fileSize = (asset as any).fileSize

      mutate({
        fileName,
        mimeType,
        fileSize: fileSize ? fileSize : undefined,
      })
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
