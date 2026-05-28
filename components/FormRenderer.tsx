import React, { useState } from "react";
import { ScrollView, View, Alert, StyleSheet } from "react-native";
import { Text, Button, TextInput, Menu, Checkbox, Card, RadioButton } from "react-native-paper";
import { useUserData } from "../components/UserDataContext";
import { FormEntry, FormInput } from "../types/types";
import { useSubmitFormEntries } from "../lib/useSubmitFormEntries";
import { tabsTheme } from "@/theme/tabsTheme";

interface FormRendererProps {
  onSubmit?: (entryId: string, values: Record<string, any>) => void;
}

export default function FormRenderer({ onSubmit }: FormRendererProps) {
  const { data, loading } = useUserData();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formMenuVisible, setFormMenuVisible] = useState(false);
  const [selectMenus, setSelectMenus] = useState<Record<string, boolean>>({});
  const submitMutation = useSubmitFormEntries();
  // Transform data - check if we have processes that need to be converted to entries
  const forms: FormEntry[] = React.useMemo(() => {
    if (!data) return [];
    
    // If data has entries array, use it directly
    if (data.entries && Array.isArray(data.entries)) {
      return data.entries;
    }
    
    // Type assertion for checking additional properties
    const dataAny = data as any;
    
    // If data is an array of processes, transform them
    if (Array.isArray(dataAny)) {
      return dataAny.map((process: any) => ({
        id: process._id || process.id,
        title: process.title,
        inputs: process.formSchema || [],
        userId: process.userEmail || '',
        createdAt: process.createdAt,
      }));
    }
    
    // If data has a processes array
    if (dataAny.processes && Array.isArray(dataAny.processes)) {
      return dataAny.processes.map((process: any) => ({
        id: process._id || process.id,
        title: process.title,
        inputs: process.formSchema || [],
        userId: process.userEmail || '',
        createdAt: process.createdAt,
      }));
    }
    
    return [];
  }, [data]);

  // Debug logging
  React.useEffect(() => {

  }, [data, loading, forms]);

  if (loading) return <Text style={styles.loadingText}>Loading forms...</Text>;
  
  // More detailed error messages
  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No data available</Text>
      </View>
    );
  }
  
  if (!forms || forms.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No forms available</Text>
        <Text style={styles.debugText}>
          Debug: Data keys: {data ? Object.keys(data).join(', ') : 'null'}
        </Text>
      </View>
    );
  }

  const selectedForm: FormEntry | undefined = forms.find((f: FormEntry) => f.id === selectedFormId);

  const handleInputChange = (field: string, value: any) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, option: string, checked: boolean) => {
    setFormValues(prev => {
      const currentValues = prev[field] || [];
      if (checked) {
        return { ...prev, [field]: [...currentValues, option] };
      } else {
        return { ...prev, [field]: currentValues.filter((v: string) => v !== option) };
      }
    });
  };

  const toggleSelectMenu = (field: string) => {
    setSelectMenus(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!selectedForm) return;

    // Validate required fields (handle booleans/arrays explicitly)
    const missingFields = selectedForm.inputs
      .filter(input => {
        if (!input.required) return false;
        const value = formValues[input.field];

        if (input.type === "boolean") {
          return value === undefined || value === null || value === "";
        }

        if (Array.isArray(value)) {
          return value.length === 0;
        }

        return value === undefined || value === null || value === "";
      })
      .map(input => input.field);

    if (missingFields.length > 0) {
      Alert.alert("Validation Error", `Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Optional: allow parent override
    if (onSubmit) {
      onSubmit(selectedForm.id, formValues);
    }

    // Prepare payload to match Next.js endpoint:
    // { entryId: string; inputs?: Record<string, string> | null }[]
    const normalizedInputs: Record<string, string> = {};
    Object.entries(formValues).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // For checkbox / multi-select, join values as comma-separated
        normalizedInputs[key] = value.join(", ");
      } else if (value === null || value === undefined) {
        // Skip null/undefined
        return;
      } else {
        normalizedInputs[key] = String(value);
      }
    });

    const payload = [
      {
        entryId: selectedForm.id,
        inputs: Object.keys(normalizedInputs).length > 0 ? normalizedInputs : null,
      },
    ];

    try {
      await submitMutation.mutateAsync(payload);
      Alert.alert("Success", "Form submitted successfully.");
      setFormValues({});
    } catch (error: any) {
      // Try to unwrap common Axios error shapes for better debugging
      if (error?.response) {
        console.error("Error submitting form - response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error?.request) {
        console.error("Error submitting form - no response received:", {
          request: error.request,
          message: error.message,
        });
      } else {
        console.error("Error submitting form - generic error:", error);
      }

      Alert.alert("Error", error?.message || "Failed to submit form.");
    }
  };

  const renderInput = (input: FormInput) => {
    const fieldValue = formValues[input.field];
    const isMenuVisible = selectMenus[input.field] || false;

    // Handle string type (also supports "short" and "text")
    if (input.type === "string" || input.type === "text" || input.type === "short") {
      return (
        <TextInput
          label={input.field}
          value={fieldValue || ""}
          onChangeText={value => handleInputChange(input.field, value)}
          mode="outlined"
          style={styles.input}
          placeholder={`Enter ${input.field.toLowerCase()}`}
          textColor="black"
          placeholderTextColor='black'
        />
      );
    }

    // Handle number type
    if (input.type === "number") {
      return (
        <TextInput
          label={input.field}
          value={fieldValue?.toString() || ""}
          onChangeText={value => handleInputChange(input.field, value === "" ? "" : Number(value))}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          placeholder={`Enter ${input.field.toLowerCase()}`}
        />
      );
    }

    // Handle paragraph type (multiline text)
    if (input.type === "paragraph") {
      return (
        <TextInput
          label={input.field}
          value={fieldValue || ""}
          onChangeText={value => handleInputChange(input.field, value)}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.paragraphInput]}
          placeholder={`Enter ${input.field.toLowerCase()}`}
          textColor="black"
        />
      );
    }

    // Handle boolean type (mutually exclusive choice across provided options)
    if (input.type === "boolean") {
      const options =
        input.options && input.options.length > 0
          ? input.options
          : ["No", "Yes"];
      const fieldValue = formValues[input.field];

      return (
        <View style={styles.booleanContainer}>
          <Text style={styles.label}>
            {input.field}
            {input.required ? <Text style={styles.required}> *</Text> : ""}
          </Text>
          <RadioButton.Group
            onValueChange={value => handleInputChange(input.field, value)}
            value={fieldValue}
          >
            {options.map(option => (
              <View key={option} style={styles.radioOptionRow}>
                <RadioButton value={option} />
                <Text style={styles.radioLabel}>{option}</Text>
              </View>
            ))}
          </RadioButton.Group>
        </View>
      );
    }

    // Handle checkbox type (multiple checkboxes with options)
    if (input.type === "checkbox" && input.options && input.options.length > 0) {
      const selectedOptions = fieldValue || [];
      return (
        <View style={styles.checkboxContainer}>
          <Text style={styles.label}>
            {input.field}
            {input.required ? <Text style={styles.required}> *</Text> : ""}
          </Text>
          {input.options.map(option => (
            <View key={option} style={styles.checkboxItem}>
              <Checkbox
                status={selectedOptions.includes(option) ? "checked" : "unchecked"}
                onPress={() => handleCheckboxChange(input.field, option, !selectedOptions.includes(option))}
              />
              <Text style={styles.checkboxLabel} onPress={() => handleCheckboxChange(input.field, option, !selectedOptions.includes(option))}>
                {option}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    // Handle select/dropdown type (if options exist but type is select/multiple)
    if ((input.type === "select" || input.type === "multiple") && input.options && input.options.length > 0) {
      return (
        <Menu
          visible={isMenuVisible}
          onDismiss={() => toggleSelectMenu(input.field)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => toggleSelectMenu(input.field)}
              style={styles.selectButton}
              contentStyle={styles.selectButtonContent}
              textColor="black"
            >
              {fieldValue || `-- Select ${input.field} --`}
            </Button>
          }
        >
          {input.options.map(option => (
            <Menu.Item
              key={option}
              onPress={() => {
                handleInputChange(input.field, option);
                toggleSelectMenu(input.field);
              }}
              title={option}
            />
          ))}
        </Menu>
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Form selector */}
          <Text style={styles.sectionTitle}>Select Form</Text>
          <Menu
            visible={formMenuVisible}
            onDismiss={() => setFormMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setFormMenuVisible(true)}
                style={styles.formSelector}
                icon="chevron-down"
                textColor={tabsTheme.colors.primary}
              >
                {selectedForm ? selectedForm.title : "-- Select a form --"}
              </Button>
            }
          >
            {forms.map((entry: FormEntry) => (
              <Menu.Item
                key={entry.id}
                onPress={() => {
                  setSelectedFormId(entry.id);
                  setFormMenuVisible(false);
                  setFormValues({});
                }}
                title={entry.title}
              />
            ))}
          </Menu>
        </Card.Content>
      </Card>

      {/* Render form inputs */}
      {selectedForm && (
        <Card style={[styles.card, styles.formCard]}>
          <Card.Content>
            <Text style={styles.formTitle}>{selectedForm.title}</Text>
            
            {selectedForm.inputs.map((input: FormInput, index: number) => (
              <View key={input.field} style={[styles.inputWrapper, index === selectedForm.inputs.length - 1 && styles.lastInput]}>
                {renderInput(input)}
              </View>
            ))}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitMutation.isPending}
              disabled={submitMutation.isPending}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              icon="send"
            >
              Submit
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tabsTheme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: tabsTheme.colors.textMuted,
  },
  debugText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 12,
    color: tabsTheme.colors.textMuted,
  },
  card: {
    marginBottom: 16,
    backgroundColor: tabsTheme.colors.surface,
    borderColor: tabsTheme.colors.border,
    borderRadius: tabsTheme.spacing.radius,
    borderWidth: 1,
    ...tabsTheme.shadow,
  },
  formCard: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    color: tabsTheme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
    color: tabsTheme.colors.text,
  },
  formSelector: {
    marginTop: 8,
    borderColor: tabsTheme.colors.border,
    borderRadius: tabsTheme.spacing.radius,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  lastInput: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: tabsTheme.colors.surface,
    color: 'black',
    marginTop: 8,
  },
  paragraphInput: {
    minHeight: 100,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: tabsTheme.colors.text,
  },
  required: {
    color: tabsTheme.colors.danger,
  },
  booleanContainer: {
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 12,
  },
  switchLabelActive: {
    color: "#111",
    fontWeight: "600",
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: tabsTheme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  radioOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  radioLabel: {
    fontSize: 16,
    color: tabsTheme.colors.text,
  },
  selectButton: {
    marginTop: 8,
    color: "black",
    borderColor: tabsTheme.colors.border,
    borderRadius: tabsTheme.spacing.radius,
  },
  selectButtonContent: {
    paddingVertical: 8,
    color: "black",
  },
  submitButton: {
    marginTop: 32,
    paddingVertical: 4,
    borderRadius: tabsTheme.spacing.radius,
    backgroundColor: tabsTheme.colors.primary,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
