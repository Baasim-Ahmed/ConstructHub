// Quick test to see if server is responsive and get task list
async function test() {
  try {
    console.log('Fetching tasks...');
    const res = await fetch('http://localhost:3000/api/tasks');
    const tasks = await res.json();
    console.log('Response status:', res.status);
    console.log('Tasks:', tasks.length > 0 ? tasks.slice(0, 2) : 'No tasks');
    
    if (tasks.length > 0) {
      const taskId = tasks[0].id;
      console.log(`\nAttempting to delete task: ${taskId}`);
      const deleteRes = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      const deleteResult = await deleteRes.json();
      console.log('DELETE status:', deleteRes.status);
      console.log('DELETE response:', JSON.stringify(deleteResult, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
