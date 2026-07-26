import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

 

export default function DocumentDetail() {
  const { id } = useGlobalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(id) ? id[0] : id;

  const documentQuery = useQuery({
    ...trpc.documents.byId.queryOptions({ id: documentId ?? "" }),
    enabled: Boolean(documentId),
  });

  if (!documentId) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Document" }} />
        <View className="h-full w-full p-4">
          <Text className="text-foreground">Missing document id.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (documentQuery.isLoading) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Document" }} />
        <View className="h-full w-full p-4">
          <Text className="text-foreground">Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!documentQuery.data) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ title: "Document" }} />
        <View className="h-full w-full p-4">
          <Text className="text-foreground">Document not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const document = documentQuery.data.document;
  const analysis = documentQuery.data.analysis;

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: document.fileName }} />
      <View className="h-full w-full p-4">
        <Text className="text-primary py-2 text-3xl font-bold">
          {document.fileName}
        </Text>
        <Text className="text-foreground">
          Status: {document.status.toUpperCase()}
        </Text>
        {document.mimeType ? (
          <Text className="text-foreground">MIME: {document.mimeType}</Text>
        ) : null}
        <Text className="text-foreground">
          Created: {new Date(document.createdAt).toLocaleString()}
        </Text>

        {analysis ? (
          <View className="mt-6">
            <Text className="text-primary text-xl font-semibold">
              Analysis summary
            </Text>
            {analysis.plainLanguageSummary ? (
              <Text className="text-foreground mt-2">
                {analysis.plainLanguageSummary}
              </Text>
            ) : (
              <Text className="text-muted-foreground mt-2">
                No summary available yet.
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-muted-foreground mt-6">
            Analysis is still pending.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
