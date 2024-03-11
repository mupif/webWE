let mupif_ValueType = [
    'Scalar',
    'Vector',
    'Tensor',
];

let mupif_DataID = [
'FID_Displacement',
'FID_Strain',
'FID_Stress',
'FID_Temperature',
'FID_Humidity',
'FID_Concentration',
'FID_Thermal_absorption_volume',
'FID_Thermal_absorption_surface',
'FID_Material_number',
'FID_BucklingShape',
'FID_FibreOrientation',
'FID_DomainNumber',
'FID_Permeability',
'FID_Velocity',
'FID_Pressure',
'FID_ESI_VPS_Displacement',
'FID_Porosity',
'FID_Mises_Stress',
'FID_MaxPrincipal_Stress',
'FID_MidPrincipal_Stress',
'FID_MinPrincipal_Stress',
'FID_MaxPrincipal_Strain',
'FID_MidPrincipal_Strain',
'FID_MinPrincipal_Strain',
'PSID_ParticlePositions',
'FuncID_ProbabilityDistribution',
'ID_None',
'ID_GrainState',
'ID_MoleculeState',
'ID_InputFile',
'ID_ForceField',
'PID_Concentration',
'PID_CumulativeConcentration',
'PID_Velocity',
'PID_transient_simulation_time',
'PID_effective_conductivity',
'PID_volume_fraction_red_phosphor',
'PID_volume_fraction_green_phosphor',
'PID_conductivity_red_phosphor',
'PID_conductivity_green_phosphor',
'PID_mean_radius_red_phosphor',
'PID_mean_radius_green_phosphor',
'PID_standard_deviation_red_phosphor',
'PID_standard_deviation_green_phosphor',
'PID_RefractiveIndex',
'PID_NumberOfRays',
'PID_LEDSpectrum',
'PID_ChipSpectrum',
'PID_LEDColor_x',
'PID_LEDColor_y',
'PID_LEDCCT',
'PID_LEDRadiantPower',
'PID_ParticleNumberDensity',
'PID_ParticleRefractiveIndex',
'PID_EmissionSpectrum',
'PID_ExcitationSpectrum',
'PID_AsorptionSpectrum',
'PID_ScatteringCrossSections',
'PID_InverseCumulativeDist',
'PID_NumberOfFluorescentParticles',
'PID_ParticleMu',
'PID_ParticleSigma',
'PID_PhosphorEfficiency',
'PID_Length',
'PID_Height',
'PID_Thickness',
'PID_Deflection',
'PID_EModulus',
'PID_PoissonRatio',
'PID_YoungModulus1',
'PID_YoungModulus2',
'PID_YoungModulus3',
'PID_PoissonRatio23',
'PID_PoissonRatio13',
'PID_PoissonRatio12',
'PID_ShearModulus23',
'PID_ShearModulus13',
'PID_ShearModulus12',
'PID_CriticalLoadLevel',
'PID_ExtensionalInPlaneStiffness',
'PID_ExtensionalOutOfPlaneStiffness',
'PID_ShearInPlaneStiffness',
'PID_ShearOutOfPlaneStiffness',
'PID_LocalBendingStiffness',
'PID_CriticalForce',
'PID_CriticalMoment',
'PID_MatrixYoung',
'PID_MatrixPoisson',
'PID_InclusionYoung',
'PID_InclusionPoisson',
'PID_InclusionVolumeFraction',
'PID_InclusionAspectRatio',
'PID_MatrixOgdenModulus',
'PID_MatrixOgdenExponent',
'PID_InclusionSizeNormalized',
'PID_CompositeAxialYoung',
'PID_CompositeInPlaneYoung',
'PID_CompositeInPlaneShear',
'PID_CompositeTransverseShear',
'PID_CompositeInPlanePoisson',
'PID_CompositeTransversePoisson',
'PID_CompositeStrain11Tensor',
'PID_CompositeStrain22Tensor',
'PID_CompositeStress11Tensor',
'PID_MatrixDensity',
'PID_CompositeDensity',
'PID_InclusionDensity',
'PID_Position',
'PID_Direction',
'PID_Status',
'PID_Label',
'PID_Chemical_specie',
'PID_Material_type',
'PID_Shape_center',
'PID_Shape_length',
'PID_Shape_radius',
'PID_Shape_side',
'PID_Crystal_storage',
'PID_Name_UC',
'PID_Lattice_vectors',
'PID_Symmetry_lattice_vectors',
'PID_Occupancy',
'PID_Bond_label',
'PID_Bond_type',
'PID_Dimension',
'PID_Acceleration',
'PID_Radius',
'PID_Size',
'PID_Mass',
'PID_Volume',
'PID_Angular_velocity',
'PID_Angular_acceleration',
'PID_Simulation_domain_dimensions',
'PID_Simulation_domain_origin',
'PID_Dynamic_viscosity',
'PID_Kinematic_viscosity',
'PID_Diffusion_coefficient',
'PID_Probability_coefficient',
'PID_Friction_coefficient',
'PID_Scaling_coefficient',
'PID_Equation_of_state_coefficient',
'PID_Contact_angle',
'PID_Amphiphilicity',
'PID_Phase_interaction_strength',
'PID_Hamaker_constant',
'PID_Zeta_potential',
'PID_Ion_valence_effect',
'PID_Debye_length',
'PID_Smoothing_length',
'PID_Lattice_spacing',
'PID_Time_step',
'PID_Number_of_time_steps',
'PID_Force',
'PID_Torque',
'PID_Density',
'PID_Pressure',
'PID_Temperature',
'PID_Distribution',
'PID_Order_parameter',
'PID_Original_position',
'PID_Current',
'PID_Final',
'PID_Delta_displacement',
'PID_External_applied_force',
'PID_Euler_angles',
'PID_Sphericity',
'PID_Young_modulus',
'PID_Poisson_ratio',
'PID_Restitution_coefficient',
'PID_Rolling_friction',
'PID_Volume_fraction',
'PID_Coupling_time',
'PID_Cutoff_distance',
'PID_Energy_well_depth',
'PID_Van_der_Waals_radius',
'PID_Dielectric_constant',
'PID_Dynamic_pressure',
'PID_Flux',
'PID_Homogenized_stress_tensor',
'PID_Strain_tensor',
'PID_Relative_velocity',
'PID_Diffusion_velocity',
'PID_Stress_tensor',
'PID_Volume_fraction_gradient',
'PID_Cohesion_energy_density',
'PID_Major',
'PID_Minor',
'PID_Patch',
'PID_Full',
'PID_Charge',
'PID_Charge_density',
'PID_Description',
'PID_Electric_field',
'PID_Electron_mass',
'PID_Electrostatic_field',
'PID_Energy',
'PID_Heat_conductivity',
'PID_Initial_viscosity',
'PID_Linear_constant',
'PID_Maximum_viscosity',
'PID_Minimum_viscosity',
'PID_Momentum',
'PID_Moment_inertia',
'PID_Potential_energy',
'PID_Power_law_index',
'PID_Relaxation_time',
'PID_Surface_tension',
'PID_Time',
'PID_Viscosity',
'PID_Collision_operator',
'PID_Reference_density',
'PID_External_forcing',
'PID_Flow_type',
'PID_Vector',
'PID_Index',
'PID_Thermodynamic_ensemble',
'PID_Variable',
'PID_None',
'PID_Lattice_parameter',
'PID_Steady_state',
'PID_Maximum_Courant_number',
'PID_Number_of_cores',
'PID_Magnitude',
'PID_Number_of_physics_states',
'PID_Cohesive_group',
'PID_FillingTime',
'PID_Demo_Min',
'PID_Demo_Max',
'PID_Demo_Integral',
'PID_Demo_Volume',
'PID_Demo_Value',
'PID_UserTimeStep',
'PID_KPI01',
'PID_ESI_VPS_TEND',
'PID_ESI_VPS_PLY1_E0t1',
'PID_ESI_VPS_PLY1_E0t2',
'PID_ESI_VPS_PLY1_E0t3',
'PID_ESI_VPS_PLY1_G012',
'PID_ESI_VPS_PLY1_G023',
'PID_ESI_VPS_PLY1_G013',
'PID_ESI_VPS_PLY1_NU12',
'PID_ESI_VPS_PLY1_NU23',
'PID_ESI_VPS_PLY1_NU13',
'PID_ESI_VPS_PLY1_E0c1',
'PID_ESI_VPS_PLY1_RHO',
'PID_ESI_VPS_hPLY',
'PID_ESI_VPS_PLY1_XT',
'PID_ESI_VPS_PLY1_XC',
'PID_ESI_VPS_PLY1_YT',
'PID_ESI_VPS_PLY1_YC',
'PID_ESI_VPS_PLY1_S12',
'PID_ESI_VPS_FIRST_FAILURE_VAL',
'PID_ESI_VPS_FIRST_FAILURE_MOM',
'PID_ESI_VPS_FIRST_FAILURE_ROT',
'PID_ESI_VPS_CRIMP_STIFFNESS',
'PID_ESI_VPS_FIRST_FAILURE_ELE',
'PID_ESI_VPS_FIRST_FAILURE_PLY',
'PID_ESI_VPS_TOTAL_MODEL_MASS',
'PID_ESI_VPS_BUCKL_LOAD',
'PID_ESI_VPS_MOMENT_CURVE',
'PID_ESI_VPS_ROTATION_CURVE',
'PID_ESI_VPS_MOMENT',
'PID_ESI_VPS_ROTATION',
'PID_ESI_VPS_THNOD_1',
'PID_ESI_VPS_THNOD_2',
'PID_ESI_VPS_SECFO_1',
'PID_ESI_VPS_SECFO_2',
'PID_BoundaryConfiguration',
'PID_SMILE_MOLECULAR_STRUCTURE',
'PID_MOLECULAR_WEIGHT',
'PID_POLYDISPERSITY_INDEX',
'PID_CROSSLINKER_TYPE',
'PID_FILLER_DESIGNATION',
'PID_SMILE_MODIFIER_MOLECULAR_STRUCTURE',
'PID_SMILE_FILLER_MOLECULAR_STRUCTURE',
'PID_CROSSLINKONG_DENSITY',
'PID_FILLER_CONCENTRATION',
'PID_DENSITY_OF_FUNCTIONALIZATION',
'PID_TEMPERATURE',
'PID_PRESSURE',
'PID_DENSITY',
'PID_TRANSITION_TEMPERATURE',
'PID_HyperelasticPotential',
'PID_ForceCurve',
'PID_DisplacementCurve',
'PID_CorneringAngle',
'PID_CorneringStiffness',
'PID_dirichletBC',
'PID_conventionExternalTemperature',
'PID_conventionCoefficient',
'PID_Footprint',
'PID_Braking_Force',
'PID_Stiffness',
'PID_Hyper1',
'PID_maxDisplacement',
'PID_maxMisesStress',
'PID_maxPrincipalStress',
'PID_Hyper2',
'PID_NrOfComponents',
'PID_Self_Diffusivity',
'PID_Mass_density',
'PID_Interface_width',
'PID_Degree_of_polymerization',
'PID_Interaction_parameter',
'PID_Molar_volume',
'PID_GrainState',
'PID_HOMO',
'PID_LUMO',
'PID_EnvTemperature',
'PID_HeaterTemperature',
'PID_BeltTemperature',
'PID_BeltVelocity',
'PID_InletFlowRate',
'PID_InletTemperature',
'PID_OutletVelocity',
'PID_TinflowSolvent',
'PID_TinflowBackground',
'PID_TinflowModelID',
'PID_TinflowModelType',
'PID_TinflowPolymer',
'PID_PolymerConcentration',
'PID_TinflowResultFile',
'PID_TinflowReportFile',
'PID_FilmThickness',
'PID_FilmTemperature',
'PID_InletFlowRateChamber1',
'PID_InletFlowRateChamber2',
'PID_InletFlowRateChamber3',
'PID_InletTemperatureChamber1',
'PID_InletTemperatureChamber2',
'PID_InletTemperatureChamber3',
'PID_ExhaustFlowRateChamber1',
'PID_ExhaustFlowRateChamber2',
'PID_ExhaustFlowRateChamber3',
'FID_FilmThickness',
'FID_FilmTemperature',
'FID_FilmConcentration',
'FID_FilmEvaporationRate',
'PID_SubstrateTemperature',
'PID_ProcessPressure',
'PID_InletFlowRateBackground',
'PID_InletFlowRateSolvent',
'PID_DepositionRate',
'PID_DepositionRateType',
'FID_DepositionRate',
'PID_Material',
'PID_MaterialCard',
'PID_MaterialList',
'PID_MaterialPlot',
'PID_DynamicViscosityGaseous',
'PID_DynamicViscosityLiquid',
'PID_HeatCapacityGaseous',
'PID_HeatCapacityLiquid',
'PID_HeatConductivityGaseous',
'PID_HeatConductivityLiquid',
'PID_SurfaceTension',
'PID_EvaporationEnthalpy',
'PID_EbullitionTemperature',
'PID_IdealGasDensity',
'PID_MolarMass',
'PID_MeltingTemperature',
'PID_MeltingEnthalpy',
'PID_CriticalTemperature',
'PID_CriticalPressure',
'PID_CriticalDensity',
'PID_AcentricFactor',
'PID_LennardJonesEnergy',
'PID_CollisionDiameter',
'PID_DoFMotion',
'PID_ThermalAccomodation',
'PID_Width',
'ID_Displacement',
'ID_Strain',
'ID_Stress',
'ID_Temperature',
'ID_Humidity',
'ID_MoistureContent',
'ID_Concentration',
'ID_Thermal_absorption_volume',
'ID_Thermal_absorption_surface',
'ID_Material_number',
'ID_Permeability',
'ID_Velocity',
'ID_Pressure',
'ID_Porosity',
'ID_Curvature',
'ID_BucklingLoad',
'ID_CompositeLongitudinalYoungModulus',
'ID_CompositeTransverseYoungModulus',
'ID_CompositeLongitudinalShearModulus',
'ID_CompositeTransverseShearModulus',
'ID_CompositeLongitudinalPoissonRatio',
'ID_CompositeTransversePoissonRatio',
'ID_VTKFile',
'ID_EnergyGap',
'ID_EnergeticDisorder'
];



let mupif_Units = [
    'm', 'kg', 's', 'A', 'K', 'mol', 'cd', 'rad', 'sr',
    'g', 'none',
    'Hz',
    'N',
    'Pa',
    'J',
    'W',
    'C',
    'V',
    'F',
    'ohm',
    'S',
    'Wb',
    'T',
    'H',
    'lm',
    'lx',
    'Bq',
    'Gy',
    'Sv',
    'deg_C',
    'deg_F',
];