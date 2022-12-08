import styles from './MapComponent.module.css';

export const Checkbox = ({ value, onChange }) => {
    return (
        <input
            type="checkbox"
            className={styles.checkbox}
            value={value}
            onChange={onChange}
            checked={value}
        />
    )
};

export default Checkbox;