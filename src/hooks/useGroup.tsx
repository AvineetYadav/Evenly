import { useContext } from 'react';
import { GroupContext } from '../context/GroupContext';

export const useGroup = () => useContext(GroupContext);