using SpacetimeDB;

[SpacetimeDB.Table(Name = "device_logs", Public = true)]
public partial class DeviceLog
{
    [PrimaryKey, AutoInc]
    public int Id;
    
    public string DeviceId;
    
    public ulong InsertedAt; // Unix timestamp σε microseconds
}

public static partial class Module
{
    [SpacetimeDB.Reducer]
public static void AddDeviceLog(ReducerContext ctx, string deviceId,ulong time)
{
    ctx.Db.DeviceLog.Insert(new DeviceLog
    {
        DeviceId = deviceId,
        InsertedAt = time,
    });
}
}