// Test script to verify task deletion
const BASE_URL = 'http://localhost:3000/api';

async function testTaskCreationAndDeletion() {
  try {
    // Step 1: Get all tasks to find one to delete
    console.log('Fetching all tasks...');
    let res = await fetch(`${BASE_URL}/tasks`);
    let data = await res.json();
    console.log(`Found ${data.length} tasks`);
    
    if (data.length === 0) {
      console.log('No tasks to delete. Creating one first...');
      
      // Get a project to link the task to
      res = await fetch(`${BASE_URL}/projects`);
      const projects = await res.json();
      
      if (projects.length === 0) {
        console.log('No projects available. Please create a project first.');
        return;
      }
      
      // Create a task
      const projectId = projects[0].id;
      res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task for Deletion',
          description: 'This is a test task',
          projectId,
          status: 'PENDING',
        }),
      });
      
      if (!res.ok) {
        console.error('Failed to create task:', await res.json());
        return;
      }
      
      data = await res.json();
      console.log('Created test task:', data.id);
    }
    
    const taskId = data[data.length - 1].id || data.id;
    console.log(`\nAttempting to delete task: ${taskId}`);
    
    // Step 2: Delete the task
    res = await fetch(`${BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
    const deleteResponse = await res.json();
    
    console.log('DELETE Response Status:', res.status);
    console.log('DELETE Response Body:', JSON.stringify(deleteResponse, null, 2));
    
    if (res.ok) {
      console.log('\n✓ Task deleted successfully');
    } else {
      console.log('\n✗ Failed to delete task');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTaskCreationAndDeletion();
