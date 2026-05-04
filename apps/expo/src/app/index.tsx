import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";
import { LegendList } from "@legendapp/list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

function ItemSeparator() {
  return <View className="h-2" />;
}

function DocumentCard(props: Readonly<{
  document: RouterOutputs["documents"]["list"][number];
  onDelete: () => void;
}>) {
  const createdAt = new Date(props.document.createdAt).toLocaleString();
  return (
    <View className="bg-muted flex flex-row rounded-lg p-4">
      <View className="grow">
        <Link
          asChild
          href={{
            pathname: "/document/[id]",
            params: { id: props.document.id },
          }}
        >
          <Pressable className="">
            <Text className="text-primary text-xl font-semibold">
              {props.document.fileName}
            </Text>
            <Text className="text-foreground mt-2">
              {props.document.status.toUpperCase()} • {createdAt}
            </Text>
            {props.document.mimeType ? (
              <Text className="text-muted-foreground mt-1">
                {props.document.mimeType}
              </Text>
            ) : null}
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="text-primary font-bold uppercase">Delete</Text>
      </Pressable>
    </View>
  );
}

function UploadDocument() {
  const queryClient = useQueryClient();

  const { mutate, error, isPending } = useMutation(
    trpc.documents.upload.mutationOptions({
      async onSuccess() {
        await queryClient.invalidateQueries(trpc.documents.list.queryFilter());
      },
    }),
  );

  const processAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const uriParts = asset.uri.split("/");
    const fallbackName = uriParts[uriParts.length - 1] ?? `upload-${Date.now()}.jpg`;
    const fileName = asset.fileName ?? fallbackName;
    const mimeType = asset.mimeType ?? "image/jpeg";
    const fileSize = asset.fileSize;

    mutate({
      fileName,
      mimeType,
      fileSize: fileSize ? fileSize : undefined,
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      processAsset(result.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      processAsset(result.assets[0]);
    }
  };

  return (
    <View className="mt-4 flex gap-3">
      <Pressable
        className={`bg-primary flex items-center rounded-lg p-4 ${isPending ? "opacity-50" : ""}`}
        onPress={handlePickImage}
        disabled={isPending}
      >
        <Text className="text-primary-foreground font-semibold text-lg">
          {isPending ? "Uploading..." : "Upload from Library"}
        </Text>
      </Pressable>
      <Pressable
        className={`bg-secondary flex items-center rounded-lg p-4 ${isPending ? "opacity-50" : ""}`}
        onPress={handleTakePhoto}
        disabled={isPending}
      >
        <Text className="text-secondary-foreground font-semibold text-lg">
          {isPending ? "Uploading..." : "Take a Photo"}
        </Text>
      </Pressable>
      {error?.data?.code === "UNAUTHORIZED" && (
        <Text className="text-destructive mt-2 text-center font-medium">
          Sign in to upload documents
        </Text>
      )}
    </View>
  );
}

function MobileAuth() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <Text className="text-foreground pb-2 text-center text-xl font-semibold">
        {session?.user.name ? `Hello, ${session.user.name}` : "Not logged in"}
      </Text>
      <Pressable
        onPress={() =>
          session
            ? authClient.signOut()
            : authClient.signIn.social({
                provider: "discord",
                callbackURL: "/",
              })
        }
        className="bg-primary flex items-center rounded-sm p-2"
      >
        <Text>{session ? "Sign Out" : "Sign In With Discord"}</Text>
      </Pressable>
    </>
  );
}

export default function Index() {
  const queryClient = useQueryClient();

  const documentQuery = useQuery(
    trpc.documents.list.queryOptions({
      limit: 20,
      offset: 0,
    }),
  );

  const deleteDocumentMutation = useMutation(
    trpc.documents.delete.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries(trpc.documents.list.queryFilter()),
    }),
  );

  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="bg-background h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center text-5xl font-bold">
          <Text className="text-primary">Klaro</Text>
        </Text>

        <MobileAuth />

        <View className="py-2">
          <Text className="text-primary font-semibold italic">
            Press on a document
          </Text>
        </View>

        <LegendList
          data={documentQuery.data ?? []}
          estimatedItemSize={20}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={ItemSeparator}
          renderItem={(p) => (
            <DocumentCard
              document={p.item}
              onDelete={() => deleteDocumentMutation.mutate({ id: p.item.id })}
            />
          )}
        />

        <UploadDocument />
      </View>
    </SafeAreaView>
  );
}
