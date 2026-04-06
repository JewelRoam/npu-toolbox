// Simple test to check hardware info fetching
import { invoke } from '@tauri-apps/api/core'

async function testHardwareInfo() {
  console.log('Testing hardware info retrieval...')
  
  try {
    console.log('Calling get_hardware_info...')
    const result = await invoke('get_hardware_info')
    console.log('Success! Result:', result)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testHardwareInfo()
