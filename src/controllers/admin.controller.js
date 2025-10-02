import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/v1/admin/orders
const getAllOrders = asyncHandler(async (req, res) => {
	const { status, payment_status } = req.query;

	let query = supabase
		.from('orders')
		.select(`
			id, status, payment_status, estimated_amount, final_amount, requested_at, assigned_at, picked_up_at, delivered_at, cancelled_at, created_at,
			customer:customer_id ( name ),
			driver:driver_id ( user:user_id ( name ) ),
			pickup_location:pickup_location_id ( address_line1, street_name, city, state, country, latitude, longitude ),
			destination_location:destination_location_id ( address_line1, street_name, city, state, country, latitude, longitude )
		`);

	if (status) {
		const statusList = status.split(',').map(s => s.trim()).filter(Boolean);
		if (statusList.length > 0) {
			query = query.in('status', statusList);
		}
	}

	if (payment_status) {
		const paymentStatuses = payment_status.split(',').map(s => s.trim()).filter(Boolean);
		if (paymentStatuses.length > 0) {
			query = query.in('payment_status', paymentStatuses);
		}
	}

	query = query.order('created_at', { ascending: false });

	const { data: orders, error } = await query;

	if (error) {
		console.error('Admin fetch orders error:', error);
		throw new ApiError(500, 'Failed to fetch orders');
	}

	return res.status(200).json(
		new ApiResponse(200, orders || [], 'All orders retrieved successfully')
	);
});

export { getAllOrders };

// PUT /api/v1/admin/orders/:orderId/assign
const assignDriverToOrder = asyncHandler(async (req, res) => {
	const { orderId } = req.params;
	const { driverId } = req.body || {};

	if (!driverId) {
		throw new ApiError(400, 'driverId is required');
	}

	// 1) Fetch order and validate state (align with existing lifecycle: expect 'booked' and no driver)
	const { data: order, error: orderError } = await supabase
		.from('orders')
		.select('id, status, driver_id')
		.eq('id', orderId)
		.single();

	if (orderError || !order) {
		throw new ApiError(404, 'Order not found');
	}

	if (order.status !== 'booked') {
		throw new ApiError(400, "Order cannot be assigned as it is not in a 'booked' state.");
	}

	if (order.driver_id) {
		throw new ApiError(400, 'Order already has a driver assigned');
	}

	// 2) Fetch driver and validate availability
	const { data: driver, error: driverError } = await supabase
		.from('drivers')
		.select('id, is_available')
		.eq('id', driverId)
		.single();

	if (driverError || !driver) {
		throw new ApiError(404, 'Driver not found');
	}

	if (!driver.is_available) {
		throw new ApiError(400, 'Driver is not available for a new delivery');
	}

	// 3) Perform coordinated updates. Note: PostgREST cannot multi-table tx in one call; best-effort with rollback.
	const nowIso = new Date().toISOString();

	// 3a) Update order: set driver, set status to 'assigned' to match existing lifecycle, set assigned_at
	const { error: orderUpdateError } = await supabase
		.from('orders')
		.update({
			driver_id: driverId,
			status: 'assigned',
			assigned_at: nowIso,
			updated_at: nowIso
		})
		.eq('id', orderId);

	if (orderUpdateError) {
		console.error('Order update failed during admin assignment:', orderUpdateError);
		throw new ApiError(500, 'Failed to assign driver to order');
	}

	// 3b) Update driver: mark busy
	const { error: driverUpdateError } = await supabase
		.from('drivers')
		.update({
			is_available: false,
			is_delivering: true,
			updated_at: nowIso
		})
		.eq('id', driverId);

	if (driverUpdateError) {
		// Attempt rollback on order assignment if driver update fails
		await supabase
			.from('orders')
			.update({ driver_id: null, status: 'booked', assigned_at: null, updated_at: new Date().toISOString() })
			.eq('id', orderId);
		console.error('Driver update failed during admin assignment:', driverUpdateError);
		throw new ApiError(500, 'Failed to update driver status after assigning order');
	}

	// 4) Fetch updated order details for response
	const { data: updatedOrder, error: fetchUpdatedError } = await supabase
		.from('orders')
		.select(`
			id, status, payment_status, estimated_amount, final_amount, requested_at, assigned_at, picked_up_at, delivered_at, cancelled_at, created_at,
			customer:customer_id ( name ),
			driver:driver_id ( user:user_id ( name ) ),
			pickup_location:pickup_location_id ( address_line1, street_name, city, state, country, latitude, longitude ),
			destination_location:destination_location_id ( address_line1, street_name, city, state, country, latitude, longitude )
		`)
		.eq('id', orderId)
		.single();

	if (fetchUpdatedError || !updatedOrder) {
		throw new ApiError(500, 'Order assigned, but failed to fetch updated details');
	}

	return res.status(200).json(
		new ApiResponse(200, updatedOrder, 'Driver assigned to order successfully')
	);
});

export { assignDriverToOrder };


