import React, { useEffect, useState } from 'react';
import { Users, Shield, Receipt, FileText, Settings, GraduationCap, ClipboardList, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { ModulosPortalCard } from './ModulosPortalCard';
import { getVisiblePortalModules } from './portalModules';
import { RolSistema, UsuarioSistema } from '../../types';
