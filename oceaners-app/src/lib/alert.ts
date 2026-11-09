import { Alert, Platform } from "react-native";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export function showAlert(
  title: string,
  message?: string,
  buttons: AlertButton[] = [],
) {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(
      [title, message].filter(Boolean).join("\n\n"),
    );

    if (confirmed) {
      buttons.find((button) => button.style !== "cancel")?.onPress?.();
    } else {
      buttons.find((button) => button.style === "cancel")?.onPress?.();
    }

    return;
  }

  Alert.alert(title, message, buttons);
}
