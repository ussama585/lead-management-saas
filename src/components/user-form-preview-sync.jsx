import { useEffect } from 'react';
import { useFormikContext } from 'formik';

export default function UserFormPreviewSync({ onChange }) {
  const { values } = useFormikContext();
  useEffect(() => { onChange(values); }, [values, onChange]);
  return null;
}
