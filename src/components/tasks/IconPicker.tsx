import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

const ICON_CATEGORIES = {
  'Common': ['📌', '✏️', '📝', '📋', '✅', '⭐', '💡', '🎯', '🔔', '📅'],
  'Work': ['💼', '💻', '📊', '📈', '📉', '📧', '📞', '🗂️', '📁', '⏰'],
  'Personal': ['🏠', '🛒', '🍎', '🏃', '💪', '🧘', '📚', '🎨', '🎵', '🎮'],
  'Health': ['💊', '🏥', '🩺', '🦷', '👓', '🧠', '❤️', '🩹', '🌡️', '💉'],
  'Finance': ['💰', '💳', '🏦', '💸', '📊', '🪙', '💎', '🏧', '💵', '📈'],
  'Travel': ['✈️', '🚗', '🚂', '🏨', '🗺️', '🧳', '📸', '🌍', '⛰️', '🏖️'],
  'Food': ['🍽️', '🍕', '🍔', '🥗', '🍳', '🥘', '🍱', '🍜', '☕', '🍰'],
  'Nature': ['🌳', '🌸', '🌻', '🌿', '🍂', '🌊', '☀️', '🌙', '⭐', '🌈'],
};

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = 'Icon',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Common');

  const handleSelect = (icon: string) => {
    onChange(icon);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.selectedIcon}>{value}</Text>
        <Text style={styles.selectorText}>Tap to change</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose an Icon</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabs}
              contentContainerStyle={styles.categoryTabsContent}
            >
              {Object.keys(ICON_CATEGORIES).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === category && styles.categoryTabTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Icons Grid */}
            <ScrollView style={styles.iconsContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.iconsGrid}>
                {ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      value === icon && styles.iconButtonSelected,
                    ]}
                    onPress={() => handleSelect(icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  selectedIcon: {
    fontSize: 32,
  },
  selectorText: {
    fontSize: 14,
    color: '#64748B',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryTabActive: {
    backgroundColor: '#6366F1',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  iconsContainer: {
    padding: 16,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  iconText: {
    fontSize: 28,
  },
});