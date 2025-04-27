import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, Button, Icon } from '@ui-kitten/components';
import { Datepicker as KittenDatepicker } from '@ui-kitten/components';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatepickerProps {
  date: Date;
  onSelect: (date: Date) => void;
  min?: Date;
  max?: Date;
  style?: any;
}

const Datepicker: React.FC<DatepickerProps> = ({ date, onSelect, min, max, style }) => {
  const [visible, setVisible] = React.useState(false);

  const toggleDatepicker = () => {
    setVisible(!visible);
  };

  const handleSelect = (nextDate: Date) => {
    onSelect(nextDate);
    setVisible(false);
  };

  const formattedDate = format(date, 'yyyy年MM月dd日', { locale: zhCN });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={toggleDatepicker} style={styles.dateButton}>
        <Text>{formattedDate}</Text>
        <Icon name="calendar-outline" style={styles.icon} fill="#8F9BB3" />
      </TouchableOpacity>

      {visible && (
        <View style={styles.datepickerContainer}>
          <KittenDatepicker
            date={date}
            onSelect={handleSelect}
            min={min}
            max={max}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  icon: {
    width: 20,
    height: 20,
  },
  datepickerContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});

export default Datepicker; 