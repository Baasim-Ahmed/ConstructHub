import { redirect } from 'next/navigation';

export default function NewTaskPage() {
    redirect('/dashboard/tasks?action=new');
}
