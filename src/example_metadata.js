let metaDataThermalStat = {
    'ClassName': 'ThermalModel',
    'ModuleName': 'models',
    'Name': 'Stationary thermal problem',
    'ID': 'ThermalModel-1',
    'Description': 'Stationary heat conduction using finite elements on rectangular domain',
    'Version_date': '1.0.0, Feb 2019',
    'Geometry': '2D rectangle',
    'Boundary_conditions': 'Dirichlet, Neumann',
    'Inputs': [
        {
            'Name': 'edge temperature',
            'Type': 'mupif.Property',
            'Required': false,
            'Type_ID': 'mupif.PropertyID.PID_Temperature',
            'Obj_ID': [
                'Cauchy top',
                'Cauchy bottom',
                'Cauchy left',
                'Cauchy right',
                'Dirichlet top',
                'Dirichlet bottom',
                'Dirichlet left',
                'Dirichlet right'
            ]
        }
    ],
    'Outputs': [
        {
            'Name': 'temperature',
            'Type_ID': 'mupif.FieldID.FID_Temperature',
            'Type': 'mupif.Field',
            'Required': false
        }
    ]
};

let metaDataThermalNonStat = {
    'ClassName': 'ThermalNonstatModel',
    'ModuleName': 'models',
    'Name': 'Non-stationary thermal problem',
    'ID': 'ThermalNonstatModel-1',
    'Description': 'Non-stationary heat conduction using finite elements on a rectangular domain',
    'Version_date': '1.0.0, Feb 2019',
    'Representation': 'Finite volumes',
    'Geometry': '2D rectangle',
    'Boundary_conditions': 'Dirichlet, Neumann',
    'Inputs': [
        {
            'Name': 'edge temperature',
            'Type': 'mupif.Property',
            'Required': false,
            'Type_ID': 'mupif.PropertyID.PID_Temperature',
            'Obj_ID': [
                'Cauchy top',
                'Cauchy bottom',
                'Cauchy left',
                'Cauchy right',
                'Dirichlet top',
                'Dirichlet bottom',
                'Dirichlet left',
                'Dirichlet right'
            ]
        }
    ],
    'Outputs': [
        {
            'Name': 'temperature',
            'Type_ID': 'mupif.FieldID.FID_Temperature',
            'Type': 'mupif.Field',
            'Required': false
        }
    ]
};

let metaDataMechanical = {
    'ClassName': 'MechanicalModel',
    'ModuleName': 'models',
    'Name': 'Plane stress linear elastic',
    'ID': 'MechanicalModel-1',
    'Description': 'Plane stress problem with linear elastic thermo-elastic material',
    'Version_date': '1.0.0, Feb 2019',
    'Geometry': '2D rectangle',
    'Boundary_conditions': 'Dirichlet',
    'Inputs': [
        {
            'Name': 'temperature',
            'Type_ID': 'mupif.FieldID.FID_Temperature',
            'Type': 'mupif.Field',
            'Required': true
        }
    ],
    'Outputs': [
        {
            'Name': 'displacement',
            'Type_ID': 'mupif.FieldID.FID_Displacement',
            'Type': 'mupif.Field',
            'Required': false
        }
    ]
};

let metaData_digimatMFAirbus = {
    "ClassName": "",
    "ModuleName": "",
    "Name": "Digimat-MF AIRBUS",
    "ID": "N/A",
    "Description": "Mean Field Homogenization for Airbus case",
    "Version_date": "05/2019",
    "Inputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time_step", "Name": "Time step", "Description": "Time step", "Units": "s", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixYoung", "Name": "Young matrix", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionYoung", "Name": "Young inclusion", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixPoisson", "Name": "Poisson ratio matrix", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionPoisson", "Name": "Poisson ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionAspectRatio", "Name": "Aspect ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionVolumeFraction", "Name": "Volume fraction inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionDensity", "Name": "density inclusion", "Units": "kg/m**3", "Required": false},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixDensity", "Name": "density matrix", "Units": "kg/m**3", "Required": false}
    ],
    "Outputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time", "Name": "Cummulative time", "Description": "Cummulative time", "Units": "s", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeAxialYoung", "Name": "Composite Axial Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneYoung", "Name": "Composite In-plane Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneShear", "Name": "Composite In-plane Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransverseShear", "Name": "Composite Transverse Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlanePoisson", "Name": "Composite In-plane Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransversePoisson", "Name": "Composite Transverse Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeDensity", "Name": "Composite density", "Units": "kg/m**3"}
    ],
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "eX_DigimatMF_JobManager"
};

let metaData_MUL2 = {
    "ClassName": "",
    "ModuleName": "",
    "Name": "MUL2",
    "Description": "MUL2-FEM code for structural analysis",
    "Inputs": [
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_YoungModulus1", "Type": "mupif.Property", "Name": "YoungModulus1"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_YoungModulus2", "Type": "mupif.Property", "Name": "YoungModulus2"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_YoungModulus3", "Type": "mupif.Property", "Name": "YoungModulus3"},
        {"Description": "Material Property", "Units": "-", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_PoissonRatio12", "Type": "mupif.Property", "Name": "PoissonRatio12"},
        {"Description": "Material Property", "Units": "-", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_PoissonRatio13", "Type": "mupif.Property", "Name": "PoissonRatio13"},
        {"Description": "Material Property", "Units": "-", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_PoissonRatio23", "Type": "mupif.Property", "Name": "PoissonRatio23"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_ShearModulus12", "Type": "mupif.Property", "Name": "ShearModulus12"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_ShearModulus13", "Type": "mupif.Property", "Name": "ShearModulus13"},
        {"Description": "Material Property", "Units": "MPa", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_ShearModulus23", "Type": "mupif.Property", "Name": "ShearModulus23"},
        {"Description": "Material Property", "Units": "kg/mm**3", "Required": true, "Origin": "Simulated", "Type_ID": "mupif.PropertyID.PID_Density", "Type": "mupif.Property", "Name": "Density"}
    ],
    "ID": "MUL2-ID-1",
    "Outputs": [
        {"Description": "First buckling load of the analyzed structure", "Units": "Nm", "Origin": "Simulated", "Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CriticalLoadLevel", "Name": "Buckling load"},
        {"Description": "Mass of the structure", "Units": "kg", "Origin": "Simulated", "Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Mass", "Name": "Structural Mass"},
        {"Description": "Three dimensional shape of first buckling load of the analyzed structure", "Units": "-", "Origin": "Simulated", "Type": "mupif.Field", "Type_ID": "mupif.FieldID.FID_BucklingShape", "Name": "Buckling shape"}
    ],
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "MUL2.JobManager@UseCase1"
};


let metaData_LAMMPS = {
    "ClassName": "LAMMPS_API",
    "ModuleName": "",
    "Name": "LAMMPS",
    "ID": "LAMMPS",
    "Description": "Moluecular dynamics simulation for the Airbus case",
    "Physics": {
        "Type": "Molecular"
    },
    "Solver": {
        "Software": "LAMMPS",
        "Language": "C++",
        "License": "Open-source",
        "Creator": "Borek Patzak",
        "Version_date": "lammps-12dec18",
        "Type": "Atomistic/Mesoscopic",
        "Documentation": "https://lammps.sandia.gov/doc/Manual.html",
        "Estim_time_step_s": 1,
        "Estim_comp_time_s": 0.01,
        "Estim_execution_cost_EUR": 0.01,
        "Estim_personnel_cost_EUR": 0.01,
        "Required_expertise": "None",
        "Accuracy": "High",
        "Sensitivity": "High",
        "Complexity": "Low",
        "Robustness": "High"
    },
    "Inputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_SMILE_MOLECULAR_STRUCTURE", "Name": "Monomer Molecular Structure", "Description": "Monomer Molecular Structure", "Units": "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MOLECULAR_WEIGHT", "Name": "Polymer Molecular Weight", "Description": "Polymer Molecular Weight",  "Units": "mol", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CROSSLINKER_TYPE", "Name": "CROSSLINKER TYPE", "Description": "CROSSLINKER TYPE",  "Units": "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_FILLER_DESIGNATION", "Name": "FILLER DESIGNATION", "Description": "FILLER DESIGNATION", "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CROSSLINKONG_DENSITY", "Name": "CROSSLINKONG DENSITY", "Description": "CROSSLINKONG DENSITY",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_FILLER_CONCENTRATION", "Name": "FILLER CONCENTRATION", "Description": "FILLER CONCENTRATION",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_TEMPERATURE", "Name": "TEMPERATURE", "Description": "TEMPERATURE",  "Units":  "degC", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PRESSURE", "Name": "PRESSURE", "Description": "TEMPERATURE",  "Units":  "atm", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_POLYDISPERSITY_INDEX", "Name": "POLYDISPERSITY INDEX", "Description": "POLYDISPERSITY INDEX",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_SMILE_MODIFIER_MOLECULAR_STRUCTURE", "Name": "SMILE MODIFIER MOLECULAR STRUCTURE", "Description": "SMILE MODIFIER MOLECULAR STRUCTURE",  "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_SMILE_FILLER_MOLECULAR_STRUCTURE", "Name": "SMILE FILLER MOLECULAR STRUCTURE", "Description": "SMILE FILLER MOLECULAR STRUCTURE", "Units":  "None", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_DENSITY_OF_FUNCTIONALIZATION", "Name": "DENSITY OF FUNCTIONALIZATION", "Description": "DENSITY OF FUNCTIONALIZATION", "Units":  "None", "Origin": "Simulated", "Required": true}
    ],
    "Outputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_DENSITY", "Name": "density", "Description": "density", "Units": "g/cm^3", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_EModulus", "Name": "Young modulus", "Description": "Young modulus", "Units": "GPa", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_effective_conductivity", "Name": "Thermal Conductivity", "Description": "Thermal Conductivity", "Units": "W/m.??C", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_TRANSITION_TEMPERATURE", "Name": "Glass Transition Temperature", "Description": "Glass Transition Temperature", "Units": "K", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio", "Name": "Poisson Ratio", "Description": "Poisson Ratio", "Units": "None", "Origin": "Simulated"}
    ]
};

let metaData_DIGIMAT = {
    "ClassName": "",
    "ModuleName": "",
    "callID": "eX_DigimatMF_JobManager",
    "Username": "root",
    "Hostname": "centos7-dev.e-xstream.local",
    "Status": "Initialized",
    "Date_time_start": "2020-09-29 14:23:52",
    "Execution": {},
    "Solver": {"Software": "Digimat-MF-2018.1", "Type": "Mean Field Homogenization", "Language": "C++", "License": "Commercial", "Creator": "Vincent Regnier", "Version_date": "05/2019", "Documentation": "See Digimat official documentation", "Estim_time_step_s": 1.0, "Estim_comp_time_s": 1.0, "Estim_execution_cost_EUR": 1.0, "Estim_personnel_cost_EUR": 1.0, "Required_expertise": "None", "Accuracy": "High", "Sensitivity": "High", "Complexity": "Low", "Robustness": "High"},
    "Name": "Digimat-MF AIRBUS",
    "ID": "N/A",
    "Description": "Mean Field Homogenization for Airbus case",
    "Physics": {"Type": "Continuum", "Entity": "Other"},
    "Inputs": [
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time_step", "Name": "Time step", "Description": "Time step", "Units": "s", "Origin": "Simulated", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixYoung", "Name": "Young matrix", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionYoung", "Name": "Young inclusion", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixPoisson", "Name": "Poisson ratio matrix", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionPoisson", "Name": "Poisson ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionAspectRatio", "Name": "Aspect ratio inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionVolumeFraction", "Name": "Volume fraction inclusion", "Units": "", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_InclusionDensity", "Name": "density inclusion", "Units": "kg/m**3", "Required": false},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_MatrixDensity", "Name": "density matrix", "Units": "kg/m**3", "Required": false}
    ],
    "Outputs": [
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Time", "Name": "Cummulative time", "Description": "Cummulative time", "Units": "s", "Origin": "Simulated"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeAxialYoung", "Name": "Composite Axial Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneYoung", "Name": "Composite In-plane Young", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlaneShear", "Name": "Composite In-plane Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransverseShear", "Name": "Composite Transverse Shear", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeInPlanePoisson", "Name": "Composite In-plane Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeTransversePoisson", "Name": "Composite Transverse Poisson ratio", "Units": "MPa"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CompositeDensity", "Name": "Composite density", "Units": "kg/m**3"}
    ],
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "eX_DigimatMF_JobManager"
};

let metaData_ABAQUS = {
    "ClassName": "",
    "ModuleName": "",
    "callID": "Abaqus@Mupif.LIST",
    "Username": "rauchs",
    "Hostname": "MRT-GRA-30488",
    "Status": "Initialized",
    "Date_time_start": "2020-09-29 13:20:06",
    "Execution": {"ID": "none", "Use_case_ID": "Dow", "Task_ID": "none"},
    "Solver": {"Software": "ABAQUS Solver using ABAQUS", "Language": "FORTRAN, C/C++", "License": "proprietary code", "Creator": "Dassault systemes", "Version_date": "03/2019", "Type": "Summator", "Documentation": "extensive", "Estim_time_step_s": 1, "Estim_comp_time_s": 0.01, "Estim_execution_cost_EUR": 0.01, "Estim_personnel_cost_EUR": 0.01, "Required_expertise": "User", "Accuracy": "High", "Sensitivity": "High", "Complexity": "Low", "Robustness": "High"},
    "Name": "ABAQUS finite element solver",
    "ID": "N/A",
    "Description": "multi-purpose finite element software",
    "Physics": {"Type": "Other", "Entity": "Other"},
    "Inputs": [
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_YoungModulus1", "Name": "E_1", "Description": "Young modulus 1", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_YoungModulus2", "Name": "E_2", "Description": "Young modulus 2", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_YoungModulus3", "Name": "E_3", "Description": "Young modulus 3", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio12", "Name": "nu_12", "Description": "Poisson\'s ration 12", "Units": "none", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio13", "Name": "nu_13", "Description": "Poisson\'s ration 13", "Units": "none", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_PoissonRatio23", "Name": "nu_23", "Description": "Poisson\'s ration 23", "Units": "none", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_ShearModulus12", "Name": "G_12", "Description": "Shear modulus 12", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_ShearModulus13", "Name": "G_13", "Description": "Shear modulus 13", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_ShearModulus23", "Name": "G_23", "Description": "Shear modulus 23", "Units": "MPa", "Required": true},
        {"Type": "mupif.Property", "Type_ID": "PropertyID.PID_Density", "Name": "rho_c", "Description": "Density of the composite", "Units": "kg/m**3", "Required": true}
    ],
    "Outputs": [
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_CriticalLoadLevel", "Name": "M_crit", "Description": "Buckling load of the structure", "Units": "none"},
        // {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Mass", "Name": "Mass", "Description": "Mass of the structure", "Units": "kg"},

        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Stiffness",  "Name": "stiffness", "Description": "rotational stiffness of the structure", "Units": "Nmm"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_Mass", "Name": "Mass", "Description": "Mass of the structure", "Units": "kg"},
        {"Type": "mupif.Property", "Type_ID": "mupif.PropertyID.PID_maxPrincipalStress", "Name": "maxStress", "Description": "maximum principal Stress", "Units": "MPa"}
    ],
    "refPoint": "none",
    "componentID": "none",
    "geomUnit": "",
    "Execution_type": "Distributed",
    "Execution_settings_jobManagerName": "Abaqus@Mupif.LIST"
};

//
//
//

let md_p1 = {
    "ClassName": "ReplcaceHostMolsWithDopantMols",
    "ModuleName": "usercase1",
    "Name": "Replcace Host Mols With Dopant Mols",
    "ID": "RHMWDM-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "coordinates",
            "Type_ID": "mupif.AtomicSetID.all",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": false,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

let md_p2 = {
    "ClassName": "ContainsPatologiesChecker",
    "ModuleName": "usercase1",
    "Name": "Contains Patologies Checker",
    "ID": "Thermo-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "boolContainsPatology",
            "Type_ID": "mupif.PropertyID.PID_Bool",
            "Type": "mupif.Property",
            "Required": false,
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

let md_p3 = {
    "ClassName": "MD",
    "ModuleName": "usercase1",
    "Name": "MD",
    "ID": "MD-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": false,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};

let md_p4 = {
    "ClassName": "ExtractHoppingSitesAndNeighbors",
    "ModuleName": "usercase1",
    "Name": "Extract Hopping Sites and Neighbors",
    "ID": "EHSAN-1",
    "Description": "Todo...",
    "Version_date": "1.0.0, Feb 2021",
    "Geometry": "unknown",
    "Boundary_conditions": "unknown",
    "Inputs": [
        {
            "Name": "allData",
            "Type": "mupif.AtomicSet",
            "Required": true,
            "Type_ID": "mupif.AtomicSetID.all",
            "Obj_ID": [
                0
            ]
        }
    ],
    "Outputs": [
        {
            "Name": "coordinates",
            "Type_ID": "mupif.AtomicSetID.all",
            "Type": "mupif.AtomicSet",
            "Required": false,
            "Obj_ID": [
                0
            ]
        },
        {
            "Name": "hopping_sites",
            "Type_ID": "mupif.HoppingSitesID.all",
            "Type": "mupif.HoppingSites",
            "Required": false,
            "Obj_ID": [
                0
            ]
        },
        {
            "Name": "neighbor_list",
            "Type_ID": "mupif.NeighborListID.all",
            "Type": "mupif.NeighborList",
            "Required": false,
            "Obj_ID": [
                0
            ]
        }
    ],
    "Execution_type": "Local"
};