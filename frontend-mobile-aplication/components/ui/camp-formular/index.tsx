import { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { styles } from './styles';

interface ProprietatiCampFormular extends TextInputProps {
  iconita?: keyof typeof Ionicons.glyphMap;
  eroare?: string;
}

export function CampFormular({ iconita, eroare, style, ...restProps }: ProprietatiCampFormular) {
  const [esteFocusat, setEsteFocusat] = useState(false);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.containerInput,
          esteFocusat && styles.containerInputFocus,
          eroare && styles.containerInputEroare,
        ]}>
        {iconita && (
          <Ionicons
            name={iconita}
            size={20}
            color={eroare ? CuloriApp.eroare : CuloriApp.textEstompat}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={CuloriApp.textEstompat}
          onFocus={() => setEsteFocusat(true)}
          onBlur={() => setEsteFocusat(false)}
          {...restProps}
        />
      </View>
      {eroare && <Text style={styles.textEroare}>{eroare}</Text>}
    </View>
  );
}
