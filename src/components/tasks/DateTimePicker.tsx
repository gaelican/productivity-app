import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  mode: 'date' | 'time' | 'datetime';
  label: string;
  placeholder?: string;
}

export const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode,
  label,
  placeholder = 'Not set',
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      setShow(true);
    } else {
      // On Android, show picker directly
      setShow(true);
    }
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS uses modal with confirm/cancel
      setTempDate(selectedDate || tempDate);
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  const handleCancel = () => {
    setShow(false);
    setTempDate(value || new Date());
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString();
    } else if (mode === 'time') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // For web, use native HTML inputs
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputRow}>
          {mode === 'date' || mode === 'datetime' ? (
            <input
              type="date"
              value={value ? value.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const newDate = new Date(e.target.value);
                  if (value && mode === 'datetime') {
                    newDate.setHours(value.getHours());
                    newDate.setMinutes(value.getMinutes());
                  }
                  onChange(newDate);
                } else {
                  onChange(undefined);
                }
              }}
              style={styles.webInput as any}
            />
          ) : null}
          {mode === 'time' || mode === 'datetime' ? (
            <input
              type="time"
              value={value ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  const newDate = value ? new Date(value) : new Date();
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  onChange(newDate);
                } else if (mode === 'time') {
                  onChange(undefined);
                }
              }}
              style={styles.webInput as any}
            />
          ) : null}
          {value && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.touchable} onPress={handlePress}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      {value && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButtonNative}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      )}

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode={mode === 'datetime' ? 'date' : mode}
          display="default"
          onChange={handleChange}
        />
      )}

      {show && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={show}
          onRequestClose={handleCancel}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCancel}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.modalButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={[styles.modalButton, styles.modalButtonDone]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={mode === 'datetime' ? 'date' : mode}
                display="spinner"
                onChange={handleChange}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  touchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  value: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  placeholder: {
    color: '#94A3B8',
  },
  icon: {
    fontSize: 20,
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  clearButtonNative: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalButton: {
    fontSize: 16,
    color: '#6366F1',
  },
  modalButtonDone: {
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webInput: {
    padding: 8,
    borderRadius: 4,
    border: '1px solid #E2E8F0',
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    outline: 'none',
  },
});