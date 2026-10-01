Native backups use public.native_app_state with owner-only RLS. Prototype public.app_state remains separate and is only read by the import action.

Optional automatic backups serialize uploads and require the account that enabled them. Restores disable automatic backup and validate record references. Prototype imports merge records into the native workspace and skip previously imported IDs. Neither import route changes prototype cloud data.

Native JSON restore retains a recovery snapshot at AsyncStorage key forsyth-business-recovery. JSON and cloud backups embed document photos, expense receipts and selected logos as image data rather than temporary device paths. Prototype data-URL receipt images are preserved. Native device testing must confirm file conversion and restoration on another device.

Signed-in end-to-end testing on the user's account and native device verification remain release gates. Browser preview tests do not validate iOS Contacts, file sharing, PDF printing or image picking.

Assistant draft delivery (added after first native build): public.assistant_drafts is an append-only inbox written through the connected Supabase tool. Authenticated phone clients have owner-only SELECT; anonymous clients have no privileges and phone clients cannot insert, update or delete inbox rows. DraftSync checks at sign-in, foreground activation and every 30 seconds while active. It rechecks the account before applying results. Incoming documents stay draft, receive local sequential numbers and append to the latest phone state; previously delivered or edited documents are not overwritten. Received IDs persist with normal local saves and backups. Full cloud-state restore remains manual and is not two-way sync.

This delivery requires a newly signed native build and a signed-in app account. An estimate queued in the database is not proof it has appeared on the phone. Device receipt must be confirmed before saying delivery is complete. No email, text or customer notification is part of delivery.
