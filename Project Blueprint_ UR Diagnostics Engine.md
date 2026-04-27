# **Architecture & Execution Plan: Universal Robot Diagnostics Engine**

## **Phase 1: Data Generation & Asset Preparation (Your Job)**

### **1\. Generating Real UR Data via Docker (Windows)**

Since you are on Windows, we will use the official containerized Universal Robots Simulator (URSim).

1. Open Windows Command Prompt or PowerShell.  
2. Run this command to pull and start the UR5e simulator:  
   docker run \--rm \-it \-p 5900:5900 \-p 6080:6080 universalrobots/ursim\_e-series  
3. Open your web browser and go to: http://localhost:6080/vnc.html  
4. Click **Connect**. You are now looking at the real UR Teach Pendant.  
5. **Create the Data:** Turn on the virtual robot, create a quick waypoint program (make it move left to right in a loop), and click Play.  
6. **Trigger an Error:** While it's moving, artificially trigger a "Protective Stop" (you can lower the safety limits in the settings to force a violation, or simulate an IO trigger).  
7. **Export Logs:** Go to the **Log Tab** \> click **Support File** \> generate and download the .zip file to your local Windows machine.  
8. **Extract:** Unzip the support file. Inside, you will find the flight\_recorder CSV logs. This is your raw\_telemetry.csv.

### **2\. The 3D Asset**

Go to the ROS-Industrial Universal Robot GitHub and download the .urdf or .dae/.gltf files for the UR5e. Place this in a folder.

### **3\. The Troubleshooting Dictionary**

Create a quick solutions.json file on your desktop.

*Format:* {"C153A2": {"title": "Joint 2 Overcurrent", "solution": "Check payload weight, inspect for physical collisions...", "highlight\_joint": "shoulder\_pan\_joint"}} *(Note: Check your CSV for the exact error code format UR uses).*

## **Phase 2: The Data Pipeline / CLI (Agent's Job)**

**What the Agent will do (CLI tasks):**

1. **Data Ingestion:** Write a Python parser using pandas to read raw\_telemetry.csv.  
2. **Column Extraction:** UR flight logs have dozens of columns. The agent must isolate timestamp, the 6 actual\_q (joint position) columns, and the fault\_status or protective\_stop columns.  
3. **Interpolation Scripting:** UR logs can have variable sample rates or high frequency (up to 500Hz). The agent will script it to downsample/interpolate to a smooth 30Hz or 60Hz for web 3D rendering.  
4. **Output Generation:** Export a highly optimized processed\_telemetry.json.

## **Phase 3: The GUI / 3D Frontend (Agent's Job)**

**What the Agent will do (Code & Scaffold tasks):**

1. **Environment Setup:** Run npx create-next-app or npm create vite@latest, install three, @react-three/fiber, @react-three/drei, and tailwindcss.  
2. **URDF/GLTF Loader:** Write a React component that loads your UR5 3D model.  
3. **Kinematic Mapping:** Write the animation loop (useFrame). It will map the actual\_q arrays from the JSON directly to the rotation axes of the 6 3D robot joints.  
4. **Timeline UI:** Build a scrubbable timeline component that updates the global state current\_timestamp.

## **Phase 4: The Rule Engine Integration (Agent's Job)**

**What the Agent will do:**

1. **State Management:** Use standard React state or Zustand to manage playback and current frame.  
2. **Condition Monitoring:** Implement a hook that monitors the telemetry stream at the current\_timestamp. If an error code appears, pause the timeline.  
3. **Visual Feedback:** Make the faulty joint on the 3D model glow red.  
4. **UI Rendering:** Render the corresponding solution from solutions.json into the right-hand diagnostic panel.