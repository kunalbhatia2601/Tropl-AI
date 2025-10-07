import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request, { params })
{
    
    // update the kunal261708@gmail.com user role to admin

    try {
        await connectDB();

        await User.findOneAndUpdate({ email: 'kunal261708@gmail.com' }, { role: 'admin' }, { new: true });

    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User role updated successfully' });
}